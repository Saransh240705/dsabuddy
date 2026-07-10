import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BRANCH_SHORT_NAMES } from "@/config/constants";
import apiClient from "@/api/client";
import { companyService } from "@/api/services/companyService";
import { customCompanyDetails } from "../../data/company_details";
import Fuse from "fuse.js";
import { forumService } from "@/api/services/forumService";
import { useUserStore } from "@/store/useUserStore";
import { isNsutOnly } from "@/utils";
import {
  CompanyDirectory,
  CompanyHeader,
  CompanyOverviewTab,
  CompanyProblemsTab,
  CompanyExperiencesTab,
  parseMarkdownToHTML,
  buildCommentTree,
  getCompanyLogoUrl,
} from "./components/pyqs";

export function PYQs() {
  const { companyName } = useParams();
  const navigate = useNavigate();

  const [companySearchInput, setCompanySearchInput] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [cgpaFilter, setCgpaFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setCompanySearchQuery(companySearchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [companySearchInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const [companyPage, setCompanyPage] = useState(1);
  const [questionPage, setQuestionPage] = useState(1);
  const companiesPerPage = 12;
  const questionsPerPage = 15;

  const getDbBranchCode = (value) => {
    if (!value || value === "all") return "all";

    // Normalize and clean string
    const val = value.toLowerCase().replace(/[()]/g, "").trim();

    // Check for CSE-related terms
    const csTerms = [
      "cs", "cse", "csai", "csda", "csds", "ciot",
      "computer science", "artificial intelligence",
      "big data", "data science", "internet of things"
    ];
    if (csTerms.some(t => val === t || val.includes(t))) return "cs";

    // Check for IT-related terms
    const itTerms = [
      "it", "itns", "information technology",
      "network and information security", "network security"
    ];
    if (itTerms.some(t => val === t || val.includes(t))) return "it";

    // Check for ECE-related terms
    const eceTerms = [
      "ece", "ecam", "evdt", "electronics",
      "vlsi"
    ];
    if (eceTerms.some(t => val === t || val.includes(t))) return "ece";

    // Check for ME-related terms
    const meTerms = [
      "me", "meev", "mechanical", "electric vehicle"
    ];
    if (meTerms.some(t => val === t || val.includes(t))) return "me";

    return val;
  };

  useEffect(() => {
    setCompanyPage(1);
  }, [companySearchQuery, branchFilter, cgpaFilter]);

  useEffect(() => {
    setQuestionPage(1);
  }, [searchQuery, difficultyFilter]);

  // ── Directory: fetch one page (12) of companies from the backend at a time ──
  const [companiesList, setCompaniesList] = useState([]);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const mapCompanyForDisplay = (c) => {
    const branchesSet = new Set();
    let minCgpa = null;
    if (c.placements && Array.isArray(c.placements)) {
      c.placements.forEach((p) => {
        if (p.eligibleBranches) {
          p.eligibleBranches.forEach((b) => branchesSet.add(b.toLowerCase()));
        }
        if (p.minCgpa !== undefined && p.minCgpa !== null) {
          if (minCgpa === null || p.minCgpa < minCgpa) {
            minCgpa = p.minCgpa;
          }
        }
      });
    }
    return {
      name: c.name,
      slug: c.slug,
      questionCount: c.questionCount || 0,
      hasQuestions: (c.questionCount || 0) > 0,
      logoUrl: c.logoUrl || getCompanyLogoUrl(c.name),
      branches: Array.from(branchesSet),
      minCgpa,
    };
  };

  useEffect(() => {
    if (companyName) return; // only browse-list needs this

    let cancelled = false;
    const fetchCompaniesPage = async () => {
      setCompaniesLoading(true);
      try {
        const params = {
          take: companiesPerPage,
          skip: (companyPage - 1) * companiesPerPage,
        };
        if (companySearchQuery) params.search = companySearchQuery;
        if (branchFilter !== "all") params.branch = getDbBranchCode(branchFilter);
        if (cgpaFilter !== "all") params.cgpa = cgpaFilter;

        const data = await companyService.getCompanies(params);
        if (cancelled) return;
        const list = Array.isArray(data.companies) ? data.companies : [];
        setCompaniesList(list.map(mapCompanyForDisplay));
        setCompaniesTotal(typeof data.total === "number" ? data.total : list.length);
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        if (!cancelled) {
          setCompaniesList([]);
          setCompaniesTotal(0);
        }
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    };

    fetchCompaniesPage();
    return () => {
      cancelled = true;
    };
  }, [companyName, companyPage, companySearchQuery, branchFilter, cgpaFilter]);

  // ── Route validation and data loading (placed at the top to satisfy Rules of Hooks) ────────────────
  const slugify = (name) =>
    (name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const normSelected = companyName ? slugify(companyName) : "";
  const [companyDetail, setCompanyDetail] = useState(null);
  const selectedCompany = companyDetail ? companyDetail.name : (companyName || "");

  const [questions, setQuestions] = useState([]);
  const [placementsInfo, setPlacementsInfo] = useState([]);
  const [metadata, setMetadata] = useState({
    eligibility_criteria: "Not specified",
    rounds_info: "Not specified",
    oa_platform: "Not specified",
    top_topics_and_questions: [],
    other_relevant_information: "",
  });
  const [loadingCompanyData, setLoadingCompanyData] = useState(false);

  useEffect(() => {
    if (!companyName || !normSelected) {
      setQuestions([]);
      setPlacementsInfo([]);
      setCompanyDetail(null);
      setMetadata({
        eligibility_criteria: "Not specified",
        rounds_info: "Not specified",
        oa_platform: "Not specified",
        top_topics_and_questions: [],
        other_relevant_information: "",
      });
      return;
    }

    const fetchCompanyData = async () => {
      setLoadingCompanyData(true);
      try {
        const [compRes, questionsRes] = await Promise.all([
          apiClient.get(`/companies/${normSelected}`),
          apiClient.get(`/companies/${normSelected}/questions`),
        ]);

        if (compRes.company) {
          const c = compRes.company;
          setCompanyDetail(c);
          setMetadata({
            eligibility_criteria: c.eligibilityCriteria || "Not specified",
            rounds_info: c.roundsInfo || "Not specified",
            oa_platform: c.oaPlatform || "Not specified",
            top_topics_and_questions: c.topTopics || [],
            other_relevant_information: c.otherInfo || "",
          });

          const mappedPlacements = (c.placements || []).map((p) => ({
            company: c.name,
            role: p.role,
            ctc_lpa: p.ctcLpa,
            stipend_month: p.stipendMonth,
            type: p.type,
            category: p.category,
            eligible_branches: p.eligibleBranches,
            min_cgpa: p.minCgpa,
          }));
          setPlacementsInfo(mappedPlacements);
        }

        if (questionsRes.companyQuestions) {
          const mappedQuestions = questionsRes.companyQuestions.map((cq) => ({
            title: cq.question?.title || "",
            difficulty: cq.question?.difficulty || "MEDIUM",
            url: cq.question?.leetcodeUrl || "",
            frequency: cq.frequency || "OCCASIONAL",
            tags: cq.question?.tags || [],
          }));
          setQuestions(mappedQuestions);
        }
      } catch (err) {
        console.error("Failed to fetch company details:", err);
        setCompanyDetail(null);
      } finally {
        setLoadingCompanyData(false);
      }
    };

    fetchCompanyData();
  }, [companyName, normSelected]);

  // ── Experiences Tab State and API Hooks ──────────────────────────────────
  const [experiences, setExperiences] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [experienceSearchInput, setExperienceSearchInput] = useState("");
  const [experienceSearchQuery, setExperienceSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setExperienceSearchQuery(experienceSearchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [experienceSearchInput]);

  const [creatingExperience, setCreatingExperience] = useState(false);
  const loggedInUser = useUserStore((state) => state.user);
  const isNsutUser = isNsutOnly(loggedInUser);

  // Form state for adding comments
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Date formatter helper
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load experiences for selected company
  const fetchExperiences = async () => {
    if (!selectedCompany) return;
    setLoadingExperiences(true);
    try {
      // Query the API using company name as search filter
      const data = await forumService.getPosts({ search: selectedCompany });
      setExperiences(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch experiences:", err);
    } finally {
      setLoadingExperiences(false);
    }
  };

  useEffect(() => {
    if (activeTab === "experiences" && selectedCompany) {
      fetchExperiences();
      setSelectedExperience(null);
    }
  }, [activeTab, selectedCompany]);

  // Load details of a specific experience
  const fetchExperienceDetail = async (id) => {
    setLoadingExperiences(true);
    try {
      const data = await forumService.getPost(id);
      setSelectedExperience(data.post);
    } catch (err) {
      console.error("Failed to fetch experience details:", err);
    } finally {
      setLoadingExperiences(false);
    }
  };

  // Upvote / Downvote experience post
  const handleVote = async (e, postId, value) => {
    e.stopPropagation();
    try {
      const data = await forumService.votePost(postId, value);

      // Update details view state if open
      if (selectedExperience && selectedExperience.id === postId) {
        setSelectedExperience(prev => ({
          ...prev,
          userVote: data.userVote,
          score: data.score,
          upvoteCount: data.score,
          isUpvoted: data.userVote === 1,
        }));
      }

      // Update list view state
      setExperiences(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            userVote: data.userVote,
            score: data.score,
            upvoteCount: data.score,
            isUpvoted: data.userVote === 1,
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  // Add top-level comment or nested reply
  const handleAddCommentOrReply = async (parentId, content) => {
    if (!selectedExperience) return;
    try {
      const data = await forumService.addComment(selectedExperience.id, {
        content,
        parentId,
      });

      setSelectedExperience(prev => ({
        ...prev,
        comments: [...(prev.comments || []), data.comment],
      }));

      // Update comment count in list view
      setExperiences(prev => prev.map(p => {
        if (p.id === selectedExperience.id) {
          return {
            ...p,
            commentCount: (p.commentCount || 0) + 1,
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to add comment/reply:", err);
    }
  };

  const handleAddTopComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || !selectedExperience) return;

    try {
      setSubmittingComment(true);
      await handleAddCommentOrReply(null, commentContent);
      setCommentContent("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await forumService.deletePost(postId);
      setExperiences(prev => prev.filter(p => p.id !== postId));
      setSelectedExperience(null);
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedExperience) return;
    try {
      await forumService.deleteComment(commentId);

      const getDescendantIds = (cId, allComments) => {
        const directChildren = allComments.filter(c => c.parentId === cId);
        let ids = [cId];
        for (const child of directChildren) {
          ids = [...ids, ...getDescendantIds(child.id, allComments)];
        }
        return ids;
      };

      const descendantIds = getDescendantIds(commentId, selectedExperience.comments || []);
      const countDeleted = descendantIds.length;

      setSelectedExperience(prev => ({
        ...prev,
        comments: (prev.comments || []).filter(c => !descendantIds.includes(c.id)),
      }));

      setExperiences(prev => prev.map(p => {
        if (p.id === selectedExperience.id) {
          return {
            ...p,
            commentCount: Math.max(0, (p.commentCount || 0) - countDeleted),
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // ── Publish experience (called by full-page editor) ───────────────────────
  const publishExperience = async ({ title, content, tags }) => {
    const finalTags = Array.isArray(tags) ? [...tags] : [];
    if (!finalTags.includes(selectedCompany)) finalTags.push(selectedCompany);
    const data = await forumService.createPost({ title, content, tags: finalTags });
    setExperiences(prev => [data.post, ...prev]);
    setSelectedExperience(data.post);
    setCreatingExperience(false);
  };

  // Detect if content is HTML (from WYSIWYG) or raw markdown
  const renderPostContent = (content) => {
    if (!content) return '';
    if (/<[a-z][\s\S]*>/i.test(content)) return content;
    return parseMarkdownToHTML(content);
  };

  // Build comment tree hierarchy for detailed view
  const commentTree = useMemo(() => {
    if (!selectedExperience || !selectedExperience.comments) return [];
    return buildCommentTree(selectedExperience.comments);
  }, [selectedExperience]);

  // Filter experiences locally using search input
  const filteredExperiences = useMemo(() => {
    if (!experienceSearchQuery) return experiences;
    const query = experienceSearchQuery.toLowerCase();
    return experiences.filter(exp =>
      exp.title?.toLowerCase().includes(query) ||
      exp.content?.toLowerCase().includes(query) ||
      exp.author?.name?.toLowerCase().includes(query)
    );
  }, [experiences, experienceSearchQuery]);

  const getPlacementsStats = () => {
    if (placementsInfo.length === 0) return null;
    const roles = Array.from(
      new Set(placementsInfo.map((p) => p.role).filter(Boolean)),
    );
    const maxCtc = Math.max(
      ...placementsInfo
        .map((p) => p.ctc_lpa)
        .filter((n) => typeof n === "number"),
      0,
    );
    const stipend = Math.max(
      ...placementsInfo
        .map((p) => p.stipend_month)
        .filter((n) => typeof n === "number"),
      0,
    );
    const branches = Array.from(
      new Set(
        placementsInfo
          .flatMap((p) => p.eligible_branches || [])
          .filter(Boolean),
      ),
    );
    const minCgpa = Math.min(
      ...placementsInfo
        .map((p) => p.min_cgpa)
        .filter((n) => typeof n === "number"),
      10,
    );
    return {
      roles,
      maxCtc: maxCtc > 0 ? maxCtc : null,
      stipend: stipend > 0 ? stipend : null,
      branches,
      minCgpa: minCgpa !== 10 ? minCgpa : null,
    };
  };

  const placementStats = getPlacementsStats();

  const formatBranches = (branches) => {
    if (!branches || branches.length === 0) return "Not specified";
    if (branches.includes("all")) return "All branches";
    return branches
      .map((b) => {
        const name = b.trim().toLowerCase();
        return BRANCH_SHORT_NAMES[name] || name.toUpperCase();
      })
      .join("/");
  };

  const lookupKey = selectedCompany
    ? selectedCompany.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "";
  const custom = selectedCompany ? customCompanyDetails[lookupKey] || {} : {};

  // ── Eligibility data ────────────────────────────────────────────────────────
  const getDetailedEligibility = () => {
    const base = custom.detailedEligibility || {
      degrees: "B.Tech / M.Tech / Dual Degree",
      branches: "CSE, IT, ECE, EE, ICE, and related branches",
      criteria:
        metadata.eligibility_criteria &&
        metadata.eligibility_criteria !== "Not specified"
          ? `Minimum ${metadata.eligibility_criteria} or equivalent.`
          : "Minimum 7.5 CGPA or equivalent.",
      backlogs: "Strictly no active backlogs allowed.",
    };
    if (placementStats) {
      if (placementStats.minCgpa)
        base.criteria = `Minimum ${placementStats.minCgpa} CGPA or equivalent.`;
      if (placementStats.branches && placementStats.branches.length > 0)
        base.branches = formatBranches(placementStats.branches);
    }
    return base;
  };

  const eligibility = getDetailedEligibility();

  // ── Stats grid data ─────────────────────────────────────────────────────────
  const getCgpaDisplay = () => {
    if (placementStats?.minCgpa) return `${placementStats.minCgpa}+`;
    const crit = eligibility.criteria || "";
    const m = crit.match(/(\d+(\.\d+)?)/);
    return m ? `${m[1]}+` : "N/A";
  };

  const getRoundsDisplay = () => {
    if (custom.timeline && custom.timeline.length > 0)
      return custom.timeline.length;
    if (metadata.rounds && metadata.rounds.length > 0)
      return metadata.rounds.length;
    return "—";
  };

  const getPlatformDisplay = () => {
    if (metadata.oa_platform && metadata.oa_platform !== "Not specified")
      return metadata.oa_platform;
    return "HackerRank";
  };

  const getBranchesDisplay = () => {
    if (placementStats?.branches?.length > 0)
      return formatBranches(placementStats.branches);
    const b = eligibility.branches || "";
    const shorts = b.match(/[A-Z]{2,4}(?:\/[A-Z]{2,4})*/g);
    return shorts ? shorts.join("/") : "CS/IT/ECE";
  };

  const getDegreeDisplay = () => {
    const deg = eligibility.degrees || "B.Tech/IDD";
    const parts = deg.split("/").map((d) => d.trim().replace(/\s+/g, "."));
    return parts.slice(0, 2).join("/");
  };

  // ── Popular Topics ──────────────────────────────────────────────────────────
  const getPopularTopics = () => {
    if (
      metadata.top_topics_and_questions &&
      metadata.top_topics_and_questions.length > 0
    ) {
      return metadata.top_topics_and_questions.slice(0, 5).map((t) => {
        const words = t.split(" ");
        return words.length > 2 ? words.slice(0, 2).join(" ") : t;
      });
    }
    return ["DP", "Graphs", "Trees", "Strings"];
  };

  const popularTopics = getPopularTopics();

  // Initialize Fuse for problems (unconditional hook)
  const fuseProblems = useMemo(() => {
    return new Fuse(questions, {
      keys: ["title", "tags"],
      threshold: 0.4,
    });
  }, [questions]);

  // ── Questions filtering (unconditional hook) ─────────────────────────────────
  const filteredQuestions = useMemo(() => {
    let result = questions;
    if (searchQuery.trim()) {
      result = fuseProblems.search(searchQuery).map((r) => r.item);
    }
    if (difficultyFilter !== "all") {
      result = result.filter(
        (q) => q.difficulty?.toLowerCase() === difficultyFilter.toLowerCase(),
      );
    }
    return result;
  }, [searchQuery, difficultyFilter, questions, fuseProblems]);

  const totalCompanyPages =
    Math.ceil(companiesTotal / companiesPerPage) || 1;

  const paginatedQuestions = useMemo(() => {
    const startIndex = (questionPage - 1) * questionsPerPage;
    return filteredQuestions.slice(startIndex, startIndex + questionsPerPage);
  }, [filteredQuestions, questionPage, questionsPerPage]);

  const totalQuestionPages =
    Math.ceil(filteredQuestions.length / questionsPerPage) || 1;

  // ── Directory landing view (conditional rendering moved here, AFTER all hooks) ─────────────────
  if (!companyName) {
    return (
      <CompanyDirectory
        companySearchInput={companySearchInput}
        setCompanySearchInput={setCompanySearchInput}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        cgpaFilter={cgpaFilter}
        setCgpaFilter={setCgpaFilter}
        companySearchQuery={companySearchQuery}
        companiesList={companiesList}
        companiesTotal={companiesTotal}
        companiesLoading={companiesLoading}
        companyPage={companyPage}
        setCompanyPage={setCompanyPage}
        companiesPerPage={companiesPerPage}
        totalCompanyPages={totalCompanyPages}
        onCompanyClick={(company) => navigate(`/dashboard/pyqs/${company.slug}`)}
      />
    );
  }

  // ── RENDER: loading state must be checked before the not-found state, since
  // company details now arrive asynchronously instead of from a preloaded list ──
  if (loadingCompanyData) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#E5E7EB] flex flex-col items-center justify-center font-mono text-xs text-neutral-500">
        <div className="w-8 h-8 border-2 border-neutral-800 border-t-[#35b9f1] rounded-full animate-spin mb-4" />
        Loading company details...
      </div>
    );
  }

  // ── Route validation (conditional rendering moved here, AFTER all hooks) ────────────────────
  if (companyName && !companyDetail) {
    return (
      <div className="text-center py-16 bg-[#161B22]/30 rounded-2xl border border-dashed border-[#1F2937]">
        <p className="text-white text-lg font-bold">
          Company "{companyName}" not found in our archives.
        </p>
        <button
          onClick={() => navigate("/dashboard/pyqs")}
          className="mt-4 bg-[#35b9f1] hover:bg-[#35b9f1]/80 text-[#0D1117] px-4 py-2 rounded-xl font-bold transition-all"
        >
          Back to Archives
        </button>
      </div>
    );
  }

  // Show timeline from custom.timeline (rich data) or fall back to metadata.rounds (PDF-extracted)
  const hasTimeline =
    (custom.timeline && custom.timeline.length > 0) ||
    (metadata.rounds && metadata.rounds.length > 0);
  const timelineSteps =
    custom.timeline && custom.timeline.length > 0
      ? custom.timeline
      : (metadata.rounds || []).map((r, i) => ({
          step: i + 1,
          title: r.roundName,
          desc: r.details,
        }));

  const initials = selectedCompany
    ? selectedCompany
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";

  const stats = [
    { label: "CGPA MIN *", value: getCgpaDisplay() },
    { label: "ROUNDS", value: getRoundsDisplay() },
    { label: "PLATFORM", value: getPlatformDisplay() },
    { label: "BRANCHES", value: getBranchesDisplay() },
    { label: "DEGREE", value: getDegreeDisplay() },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDifficultyFilter("all");
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#E5E7EB] pb-20">
      <CompanyHeader
        onBack={() => navigate("/dashboard/pyqs")}
        selectedCompany={selectedCompany}
        companyDetail={companyDetail}
        initials={initials}
        stats={stats}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        questionsCount={questions.length}
        showStats={isNsutUser}
      />

      {activeTab === "overview" && (
        <CompanyOverviewTab
          hasTimeline={hasTimeline}
          timelineSteps={timelineSteps}
          cgpaDisplay={getCgpaDisplay()}
          branchesDisplay={getBranchesDisplay()}
          placementStats={placementStats}
          eligibilityBranches={eligibility.branches}
          popularTopics={popularTopics}
          questionsCount={questions.length}
          onViewProblems={() => setActiveTab("problems")}
          showEligibility={isNsutUser}
          showStats={isNsutUser}
        />
      )}

      {activeTab === "problems" && (
        <CompanyProblemsTab
          subTitle={custom.subTitle}
          placementStats={placementStats}
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          filteredQuestions={filteredQuestions}
          paginatedQuestions={paginatedQuestions}
          questionPage={questionPage}
          setQuestionPage={setQuestionPage}
          questionsPerPage={questionsPerPage}
          totalQuestionPages={totalQuestionPages}
          showStats={isNsutUser}
        />
      )}

      {activeTab === "experiences" && (
        <CompanyExperiencesTab
          selectedCompany={selectedCompany}
          navigate={navigate}
          loggedInUser={loggedInUser}
          formatDate={formatDate}
          renderPostContent={renderPostContent}
          commentTree={commentTree}
          creatingExperience={creatingExperience}
          setCreatingExperience={setCreatingExperience}
          publishExperience={publishExperience}
          selectedExperience={selectedExperience}
          setSelectedExperience={setSelectedExperience}
          fetchExperienceDetail={fetchExperienceDetail}
          handleVote={handleVote}
          handleDeletePost={handleDeletePost}
          handleDeleteComment={handleDeleteComment}
          handleAddCommentOrReply={handleAddCommentOrReply}
          commentContent={commentContent}
          setCommentContent={setCommentContent}
          submittingComment={submittingComment}
          handleAddTopComment={handleAddTopComment}
          experienceSearchInput={experienceSearchInput}
          setExperienceSearchInput={setExperienceSearchInput}
          loadingExperiences={loadingExperiences}
          filteredExperiences={filteredExperiences}
        />
      )}
    </div>
  );
}
