import {
  Person,
  Gem,
  Timestamps,
  Comments,
  ScalesBalanced,
  Video,
  Star,
  ArrowUpFromSquare,
  Xmark,
  ChevronRight,
} from "@gravity-ui/icons";
import { Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useGeneralData } from "../Context/GeneralContext";
import { getLocalLogo } from "@/utils/getCompanyLogo";
import { runProfileNavigationGuard } from "../utils/profileNavigation";
import { useSelectedCompany } from "../Context/SelectedCompanyContext";
const NAV_ITEMS = [
  // {
  //   icon: Sparkles,
  //   label: "Ask AI · Prescription Reader",
  //   id: "askAi",
  //   link: "/ask-ai",
  // },
  {
    icon: Timestamps,
    label: "My Company Profile",
    id: "MyMLMProfile",
    link: "/mlmprofile",
  },
  {
    icon: Gem,
    label: "My Subscriptions",
    id: "Subscriptions",
    link: "/subscription",
  },

  {
    icon: Comments,
    label: "Customer Support",
    id: "customerSupport",
    link: "https://wa.me/919229885383",
  },
  {
    icon: ScalesBalanced,
    label: "Privacy Policy",
    id: "privacyPolicy",
    link: "https://mlmlive.in/Privacy.html",
  },
  {
    icon: Star,
    label: "Share Review & Feedback",
    id: "Review",
    link: "https://play.google.com/store/apps/details?id=com.mlmbooster.mlmbooster&hl=en",
  },
  {
    icon: Video,
    label: "Learn How to Use App",
    id: "howtoUse",
    link: "https://youtube.com/@mlmboosterapp?si=4AQiHvcR8x6CmOHX",
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useGeneralData();
  const { selectedCompany } = useSelectedCompany();

  let selectedProfile = null;
  try {
    selectedProfile = JSON.parse(sessionStorage.getItem("mlmProfile") || "null");
  } catch {}

  const companyName =
    selectedCompany?.name || selectedProfile?.companyName || "MLM LIVE";
  const companyLogo =
    getLocalLogo(selectedCompany?.id) ||
    getLocalLogo(selectedProfile?.companyId) ||
    "";
  const companyProfileLogo = selectedProfile?.profileImageURLs[0];
  const fullName = selectedProfile?.fullName || "";
  const mobile = selectedProfile?.mobile || "";

  const close = () => setMobileOpen(false);

  const handleNav = (link) => {
    if (!link) return;
    if (link.startsWith("http")) {
      close();
      window.open(link, "_blank");
      return;
    }
    const proceed = () => {
      close();
      navigate(link);
    };
    runProfileNavigationGuard(location.pathname, proceed);
  };

  const isActive = (link) => location.pathname === link;

  return (
    <>
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          "fixed md:relative top-0 left-0 z-[60] md:z-auto",
          "h-full flex flex-col",
          "bg-accent dark:bg-[#080b14]",
          "transition-all duration-300 ease-in-out",
          "shadow-2xl md:shadow-none overflow-hidden",
          collapsed ? "md:w-[72px]" : "md:w-[268px]",
          mobileOpen
            ? "w-[268px] translate-x-0"
            : "w-[268px] -translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex flex-col px-5 pt-11 pb-11 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/12 to-transparent pointer-events-none" />

          {/* Mobile close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 md:hidden w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white"
          >
            <Xmark className="w-4 h-4" />
          </button>

          <div
            className={`flex items-center gap-3.5 relative z-10 ${collapsed ? "md:flex-col md:gap-2" : ""}`}
          >
            <div className="w-18 h-18 rounded-full 0.5  shadow-xl flex items-center justify-center shrink-0 overflow-hidden bg-white ">
              {companyLogo ? (
                <img
                  src={companyProfileLogo|| companyLogo[0]?.link || ""}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-accent font-bold text-xl">M</span>
              )}
            </div>

            <div
              className={`flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100"}`}
            >
              <h2 className="text-white font-display font-bold text-[17px] leading-tight truncate w-36">
                {companyName === "ANVIK INTERNATIONAL" ? "ANVIK" : companyName}
              </h2>
              {fullName && (
                <div
                  className="mt-0.5 w-36 overflow-hidden text-white/75 text-[15px] font-medium"
                  style={{
                    maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                    WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                  }}
                  aria-label={fullName}
                  title={fullName}
                >
                  <div className="mlm-profile-name-marquee whitespace-nowrap">
                    <span>{fullName}</span>
                    <span aria-hidden="true">{fullName}</span>
                  </div>
                </div>
              )}
              {mobile && (
                <p className="text-white/55 text-[14px] mt-0.5 font-mono">
                  +91 {mobile}
                </p>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .mlm-profile-name-marquee {
            display: flex;
            width: max-content;
            gap: 2.5rem;
            animation: mlm-profile-name-scroll 9s linear infinite;
            will-change: transform;
          }
          @keyframes mlm-profile-name-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(calc(-50% - 1.25rem)); }
          }
          @media (prefers-reduced-motion: reduce) {
            .mlm-profile-name-marquee { animation: none; }
          }
        `}</style>

        {/* Nav area - slides up over accent */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0d1120] rounded-t-[28px] overflow-hidden -mt-3 relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3.5 mb-1 opacity-40 md:hidden" />

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 layout-scroll-container">
            {NAV_ITEMS.map(({ icon: Icon, label, id, link }) => {
              const active = isActive(link);
              return (
                <button
                  key={id}
                  onClick={() => handleNav(link)}
                  className={[
                    "w-full h-[60px] bg-accent/10 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 group",
                    active
                      ? "bg-accent text-black shadow-sm"
                      : "text-foreground/70",
                  ].join(" ")}
                  title={collapsed ? label : undefined}
                >
                  <span
                    className={`shrink-0 transition-transform duration-150 ${active ? "" : "group-hover:scale-110"}`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span
                    className={`flex-1 text-left whitespace-nowrap transition-all duration-300 ${collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : ""}`}
                  >
                    {label}
                  </span>
                  <span
                    className={`ml-auto shrink-0 transition-transform duration-150 ${active ? "" : "group-hover:translate-x-0.5"}`}
                    aria-hidden="true"
                  >
                    <ChevronRight className="w-[16px] h-[16px]" />
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-border">
            <button
              onClick={() => {
                runProfileNavigationGuard(location.pathname, () => {
                  close();
                  navigate("/logout");
                });
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-danger group"
            >
              <span className="shrink-0 ">
                <ArrowUpFromSquare className="w-[18px] h-[18px]" />
              </span>
              <span
                className={`flex-1 text-left whitespace-nowrap ${collapsed ? "md:opacity-0 md:w-0 overflow-hidden" : ""}`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
