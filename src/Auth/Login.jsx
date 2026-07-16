"use client";
import { useEffect, useState, useRef } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import logo from "/mlmboo2.ico";
import { InputOTP } from "@heroui/react";
import { useNavigate } from "react-router";
import { toast } from "@heroui/react";
import { login, getAuthErrorMessage } from "../services/authService";
import { setAuthFlowPending, setUser } from "../utils/authStorage";
import { db } from "@firebase-config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { COLLECTIONS } from "../collections";
import {
  clearCompanyProfileStorage,
  clearMlmProfileStorage,
  hasSelectedCompanyInStorage,
  saveMlmProfileToStorage,
  syncSelectedCompanyFromProfile,
} from "../utils/companyStorage";

export function Login() {
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(false);
  const [formError, setFormError]   = useState("");
  const [pin, setPin]               = useState("");
  const [lockout, setLockout]       = useState(0);
  const failCountRef                = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_migrated") === "1") {
      toast.success("Security update applied. Please login again.");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (lockout > Date.now()) {
      const secs = Math.ceil((lockout - Date.now()) / 1000);
      setFormError(`Too many failed attempts. Try again in ${secs}s.`);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data     = {};
    formData.forEach((value, key) => { data[key] = value.toString().trim(); });

    if (!/^[0-9]{10}$/.test(data.mobile)) {
      setFormError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!/^[0-9]{4}$/.test(pin)) {
      setFormError("Please enter a valid 4-digit PIN");
      return;
    }

    try {
      setLoading(true);
      setFormError("");
      setAuthFlowPending(true);

      const result = await login(data.mobile, pin);

      // Account exists but needs OTP verification first
      if (result.status === "unverified") {
        toast.success("OTP भेजा गया! Verify करें।");
        navigate("/signup", {
          state: {
            verifyMode: true,
            sessionId:  result.sessionId,
            mobile:     result.mobile,
            userId:     result.userId,
          },
        });
        return;
      }

      // Successful login
      failCountRef.current = 0;
      setLockout(0);

      setUser(result.user);

      // Firestore is the source of truth for the poster-creation profile.
      // Never decide this flow from a browser-cached profile object.
      let mlmProfile = null;
      try {
        const profileQuery = query(
          collection(db, COLLECTIONS.MLMPROFILES),
          where("mobile", "==", data.mobile),
        );
        const profileSnapshot = await getDocs(profileQuery);
        if (!profileSnapshot.empty) {
          const profileDoc = profileSnapshot.docs[0];
          mlmProfile = { id: profileDoc.id, ...profileDoc.data() };
        }
      } catch (profileLookupError) {
        console.error("Unable to verify MLM profile during login:", profileLookupError);
        throw new Error("Profile verification failed. Please try login again.");
      }

      if (mlmProfile) {
        clearCompanyProfileStorage();
        saveMlmProfileToStorage(mlmProfile);
        await syncSelectedCompanyFromProfile({ force: true });
        toast.success("Login Successful!");
        navigate("/");
      } else {
        clearMlmProfileStorage();
        toast.success("Login Successful!");
        navigate(hasSelectedCompanyInStorage() ? "/" : "/selectcomp");
      }
    } catch (error) {
      const msg = getAuthErrorMessage(error);

      // Track failed PIN attempts for client-side lockout
      if (msg.toLowerCase().includes("incorrect pin") || msg.toLowerCase().includes("pin")) {
        failCountRef.current += 1;
        if (failCountRef.current >= 5) {
          const until = Date.now() + 30_000;
          setLockout(until);
          failCountRef.current = 0;
          setFormError("Too many failed attempts. Please wait 30 seconds.");
        } else {
          setFormError(`${msg} (${failCountRef.current}/5)`);
        }
      } else {
        setFormError(msg);
      }
    } finally {
      setAuthFlowPending(false);
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(170deg, #040c22 0%, #0088DA 40%, #f4f6fb 40%)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[50vh] overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #0088DA, transparent)" }}
        />
        <div
          className="absolute top-28 -left-16 w-44 h-44 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0088DA, transparent)" }}
        />
        <div className="absolute top-6 right-8 w-12 h-12 rounded-2xl border border-white/10 rotate-12" />
        <div className="absolute top-20 right-20 w-5 h-5 rounded-full bg-white/10" />
        <div className="absolute top-10 left-12 w-3 h-3 rounded-full bg-white/15" />
      </div>

      <div className="relative z-10 flex flex-col items-center pt-14 pb-10 px-6">
        <div
          className="w-[72px] h-[72px] bg-white rounded-[22px] flex items-center justify-center p-2 mb-5"
          style={{ boxShadow: "0 12px 40px rgba(14,36,92,0.5), 0 4px 12px rgba(0,0,0,0.25)" }}
        >
          <img src={logo} alt="MLM LIVE" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-white font-display font-bold text-[26px] leading-tight text-center">
          वापस स्वागत है!
        </h1>
        <p className="text-white/60 text-[13px] font-medium mt-1 text-center">
          Welcome back — Sign in to MLM LIVE
        </p>
      </div>

      <div className="relative z-10 flex-1 bg-[var(--background)] rounded-t-[32px] px-5 pt-6 pb-10"
        style={{ boxShadow: "0 -4px 32px rgba(0,0,0,0.12)" }}>
        <div className="w-full max-w-sm mx-auto">
          <Form className="flex w-full flex-col gap-5" onSubmit={onSubmit}>

            <TextField name="mobile" type="tel" className="w-full">
              <Label className="font-semibold text-[13px] text-foreground/70 mb-1.5 block">
                Mobile Number / मोबाइल नंबर
              </Label>
              <div className="h-[52px] flex items-center  shadow-sm rounded-2xl px-3">
                <Input
                  className="w-full bg-transparent outline-none text-[15px] font-medium tracking-wide"
                  placeholder="Enter your 10-digit number"
                  maxLength={10}
                  autoComplete="username"
                  inputMode="numeric"
                  autoCapitalize="none"
                />
              </div>
              <FieldError className="text-danger mt-1 text-xs" />
            </TextField>

            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center mb-2">
                <Label className="font-semibold text-[13px] text-foreground/70">
                  4-Digit PIN / 4 अंकों का PIN
                </Label>
                <span
                  onClick={() => navigate("/forgetpin")}
                  className="text-[12px] text-accent font-bold cursor-pointer"
                  style={{ touchAction: "manipulation" }}
                >
                  Forgot PIN?
                </span>
              </div>
              <InputOTP
                name="pin"
                maxLength={4}
                value={pin}
                onChange={(val) => setPin(val)}
                type="password"
                autoComplete="current-password"
                inputMode="numeric"
                pattern="[0-9]*"
                pushPasswordManagerStrategy="increase-width"
              >
                <InputOTP.Group className="gap-3 w-full justify-between">
                  {[0, 1, 2, 3].map((i) => (
                    <InputOTP.Slot
                      key={i}
                      index={i}
                      className="flex-1 h-[56px] text-2xl font-bold bg-[var(--field-background)] border border-[var(--border)] data-[focus=true]:border-accent data-[focus=true]:ring-2 data-[focus=true]:ring-accent/20 shadow-sm rounded-2xl"
                    />
                  ))}
                </InputOTP.Group>
              </InputOTP>
            </div>

            {formError && (
              <div className="bg-danger/8 border border-danger/20 text-danger text-[13px] text-center py-3 px-4 rounded-2xl font-medium">
                {formError}
              </div>
            )}

            <Button
              className="w-full h-[54px] text-white font-bold text-[15px] rounded-2xl mt-1"
              style={{
                background: "linear-gradient(135deg, #0088DA 0%, #1a3a8f 60%, #2a4faa 100%)",
                boxShadow: "0 8px 24px rgba(14,36,92,0.35), 0 2px 6px rgba(0,0,0,0.12)",
              }}
              type="submit"
              isLoading={loading}
            >
              {loading ? "Logging in..." : "Login करें — Sign In"}
            </Button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="w-full h-[52px] rounded-2xl border border-[var(--border)] text-accent font-bold text-[14px]"
              style={{
                background: "var(--field-background)",
                touchAction: "manipulation",
              }}
            >
              नया अकाउंट बनाएं — Register
            </button>

          </Form>
        </div>
      </div>
    </div>
  );
}
