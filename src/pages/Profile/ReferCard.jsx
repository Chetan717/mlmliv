import { useState, useEffect, useCallback } from "react";
import { Modal } from "@heroui/react";
import {
  Copy,
  Check,
  Xmark,
  Person,
  NodesRight,
  CreditCard,
} from "@gravity-ui/icons";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import referGraphic from "./refer.png";
import { COLLECTIONS } from "../../collections";
import { getUser } from "../../utils/authStorage";

function ReferEarningsModal({ user, isOpen, onClose }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (!user?.referCode) { setLoading(false); return; }

    const fetchReferrals = async () => {
      try {
        const db = getFirestore();
        const q  = query(
          collection(db, COLLECTIONS.USERS),
          where("referredBy", "==", user.referCode)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => d.data());
        setReferrals(data);
      } catch (e) {
        console.error("Failed to load referrals:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [isOpen, user?.referCode]);

  const totalCredits = referrals.length * 10;

  const maskName = (name = "") => {
    if (name.length <= 2) return name;
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  };
  const maskMobile = (mob = "") => {
    if (mob.length < 7) return "**********";
    return mob.slice(0, 3) + "****" + mob.slice(-3);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container placement="top">
          <Modal.Dialog className="w-full max-w-md">
            <Modal.CloseTrigger className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted/40 hover:bg-muted/60 flex items-center justify-center transition-colors">
              <Xmark className="w-4 h-4 text-foreground" />
            </Modal.CloseTrigger>

            <Modal.Body className="overflow-y-auto">
        <h2 className="text-[18px] font-display font-bold text-foreground mb-1">Referral Earnings</h2>
        <p className="text-[13px] text-muted-foreground mb-5">People who joined using your code</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-accent/8 dark:bg-accent/15 border border-accent/15 rounded-2xl p-4 text-center">
            <p className="text-2xl font-display font-bold text-accent">{loading ? "—" : referrals.length}</p>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1">Total Referrals</p>
          </div>
          <div className="bg-[#e8005a]/8 dark:bg-[#e8005a]/15 border border-[#e8005a]/15 rounded-2xl p-4 text-center">
            <p className="text-2xl font-display font-bold text-[#e8005a]">{loading ? "—" : totalCredits}</p>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1">Credits Earned</p>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto layout-scroll-container">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
            ))
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                <Person className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">No referrals yet</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Share your code to start earning credits</p>
              </div>
            </div>
          ) : (
            referrals.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-accent uppercase">
                    {(r.name || r.fullName || "?")[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground capitalize">
                    {maskName(r.name || r.fullName || "User")}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {maskMobile(r.mobileNo || r.mobile || "")}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full">
                  +10 credits
                </div>
              </div>
            ))
          )}
        </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default function ReferCard() {
  const [user, setUser]           = useState(null);
  const [copied, setCopied]       = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const u = getUser();
      if (u) setUser(u);
    } catch {}
  }, []);

  const referCode = user?.referCode || "—";

  const handleCopy = useCallback(async () => {
    if (!user?.referCode) return;
    try {
      await navigator.clipboard.writeText(user.referCode);
    } catch {
      const el = document.createElement("textarea");
      el.value = user.referCode;
      el.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(el);
      el.focus(); el.select(); document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [user?.referCode]);

  const handleShare = useCallback(() => {
    const appLink = "https://play.google.com/store/apps/details?id=com.mlmbooster.mlmbooster";
    const msg =
      `🌟 *Join MLM LIVE & Grow Your Network!*\n\n` +
      `Hey! I'm using *MLM LIVE* — the best app to create stunning marketing images for your MLM business instantly.\n\n` +
      `🎁 *Use my referral code:* \`${referCode}\`\n\n` +
      `✅ *You get:* 10 Free Credits on joining\n` +
      `🎉 *I get:* 10 Credits for referring you\n\n` +
      `📲 Download now from Play Store:\n` +
      `👉 ${appLink}`;

    // If running inside the MLM LIVE Android/iOS app (React Native WebView),
    // delegate to the native share sheet so the user can share to any app
    // (WhatsApp, SMS, Email, etc.) with the referral/coupon code attached.
    if (typeof window !== "undefined" && window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "SHARE_SOMETHING",
          url: appLink,
        }),
      );
      return;
    }

    // Running as a plain web page — use the native Web Share API if available.
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({ title: "MLM LIVE", text: msg, url: appLink })
        .catch(() => {
          // User cancelled or share failed — fall back to WhatsApp below
          const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, "_blank");
        });
      return;
    }

    // Final fallback: open WhatsApp share link
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  }, [referCode]);

  return (
    <>
      <ReferEarningsModal
        user={user}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      <div className="w-full px-1">
        <div
          className="relative overflow-hidden rounded-2xl p-5 w-full"
          style={{
            background:
              "linear-gradient(135deg, #0088DA 0%, #0088DA 60%, #0088DA 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-10 -bottom-10 w-20 h-20 rounded-full bg-white/[0.07] pointer-events-none" />

          {/* Content: left side */}
          <div className="relative z-10 max-w-[58%]">
            <p className="text-white/80 text-[11px] font-medium mb-0.5">
              Invite friends & earn
            </p>
            <p className="text-white text-[13px] font-bold mb-3">
              10 Free Credits per referral!
            </p>

            {/* Code box */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 bg-white/18 border border-white/30 rounded-xl px-3 py-2 flex-row min-w-0">
                <span className="text-white text-[12px] font-mono font-bold tracking-widest truncate">
                  {referCode}{" "}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied ? (
                    <Check width={15} height={15} className="text-green-300" />
                  ) : (
                    <Copy width={15} height={15} />
                  )}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleShare}
                className="bg-white/15 flex flex-row gap-2  border border-white/35 text-white font-semibold text-[11px] px-4 py-1.5 rounded-full hover:bg-white/25 active:scale-95 transition-all"
              >
                <span className="text-white text-[11px] font-mono font-bold tracking-widest truncate">
                  Share MLMLIVE
                </span>
                <NodesRight width={15} height={15} />
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-white/15 flex flex-row gap-2  border border-white/35 text-white font-semibold text-[11px] px-4 py-1.5 rounded-full hover:bg-white/25 active:scale-95 transition-all"
              >
                <span className="text-white text-[11px] font-mono font-bold tracking-widest truncate">
                  View Referrals
                </span>
                <CreditCard width={15} height={15} />
              </button>
            </div>
          </div>

          {/* Graphic */}
          <img
            src={referGraphic}
            alt="refer graphic"
            className="absolute w-[120px] -bottom-0 right-0 object-contain pointer-events-none"
          />
        </div>
      </div>
    </>
  );
}
