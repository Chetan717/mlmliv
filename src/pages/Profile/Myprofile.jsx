import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Modal, toast } from "@heroui/react";
import ReferCard from "./ReferCard";
import SettingsMenu from "./Settingsmenu";
import { PencilLine, ArrowLeft, LogOut, Check } from "lucide-react";
import { COLLECTIONS } from "../../collections";
import { getUser, setUser } from "../../utils/authStorage";

function Myprofile() {
  const [userData, setUserData]     = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [editOpen, setEditOpen]     = useState(false);
  const [newName, setNewName]       = useState("");
  const [loading, setLoading]       = useState(false);
  const navigate                    = useNavigate();

  useEffect(() => {
    const parsed = getUser();
    if (parsed) {
      setUserData(parsed);
      setNewName(parsed.name);
    }
    const rawProfile = sessionStorage.getItem("mlmProfile");
    if (rawProfile) setProfileData(JSON.parse(rawProfile));
  }, []);

  const handleEditSave = async () => {
    if (!newName.trim() || !userData) return;
    setLoading(true);
    try {
      const db  = getFirestore();
      const q   = query(collection(db, COLLECTIONS.USERS), where("mobileNo", "==", userData.mobileNo));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { name: newName.trim() });
        const updated = { ...userData, name: newName.trim() };
        setUser(updated);
        setUserData(updated);
      }
      setEditOpen(false);
      toast.success("Name updated successfully");
    } catch (err) {
      
      toast.danger("Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const profileImageURL =
    profileData?.profileImageURLs?.[0] ||
    `https://ui-avatars.com/api/?background=0e245c&color=fff&name=${encodeURIComponent(userData?.name || "User")}&bold=true`;

  if (!userData) return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="w-8 h-8 border-[3px] border-muted border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {/* Edit name modal */}
      <Modal
        isOpen={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setNewName(userData.name);
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog className="w-full max-w-[400px]">
              <Modal.CloseTrigger className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted/30 hover:bg-muted/50 flex items-center justify-center transition-colors">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </Modal.CloseTrigger>

              <Modal.Body>
                <div className="mb-5">
                  <h3 className="text-[18px] font-display font-bold text-foreground">
                    Edit Name
                  </h3>
                </div>

                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background dark:bg-[#1a2236] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-[15px] font-medium text-foreground"
                  placeholder="Enter your name"
                  autoFocus
                />

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => {
                      setEditOpen(false);
                      setNewName(userData.name);
                    }}
                    className="flex-1 h-12 rounded-xl font-semibold text-[14px] bg-muted/30 hover:bg-muted/50 text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={
                      loading ||
                      !newName.trim() ||
                      newName.trim() === userData.name
                    }
                    className="flex-1 h-12 rounded-xl font-bold text-[14px] bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Save
                      </>
                    )}
                  </button>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <div className="flex flex-col w-full min-h-screen bg-background pb-4 md:pb-10">
        {/* Hero header */}
        <div className="relative bg-accent dark:bg-[#080b14] pt-10 pb-16 px-5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/", { replace: true })}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-[18px] font-display font-bold text-white">
              My Profile
            </h1>
          </div>

          {/* Avatar row */}
          <div className="relative z-10 flex items-end gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl border-2 border-white/30 shadow-xl overflow-hidden bg-white flex items-center justify-center">
                <img
                  src={profileImageURL}
                  alt={userData.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <PencilLine className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h2 className="text-[20px] font-display font-bold text-white capitalize truncate">
                {userData.name}
              </h2>
              <p className="text-white/65 text-[13px] font-mono mt-0.5">
                +91 {userData.mobileNo}
              </p>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[12px] font-semibold px-4 py-2 rounded-full transition-colors mb-1"
            >
              <PencilLine className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>

        {/* White card slides up over hero */}
        <div className="flex-1 bg-background dark:bg-background rounded-t-[28px] -mt-6 relative z-10 px-4 pt-5 space-y-4">
          {/* Refer Card */}
          <ReferCard />

          {/* Settings */}
          <div className="bg-white dark:bg-[#141824] rounded-2xl border border-border shadow-sm overflow-hidden">
            <SettingsMenu />
          </div>

          {/* Logout */}
          <button
            onClick={() => navigate("/logout")}
            className="w-full h-[52px] rounded-2xl bg-danger/8 hover:bg-danger/14 border border-danger/15 text-danger font-bold text-[14px] flex items-center justify-center gap-2.5 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Log Out Securely
          </button>

          <div className="text-center">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Made in India 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Myprofile;
