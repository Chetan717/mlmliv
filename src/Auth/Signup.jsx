"use client";

import { useEffect, useState } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  InputOTP,
  toast,
} from "@heroui/react";
import { useNavigate, useLocation } from "react-router";
import logo from "/mlmboo2.ico";

import {
  signupInit,
  signupVerify,
  verifyUser,
  resendOtp,
  getAuthErrorMessage,
} from "../services/authService";

import { setAuthFlowPending, setUser } from "../utils/authStorage";

import {
  clearCompanyProfileStorage,
  saveMlmProfileToStorage,
} from "../utils/companyStorage";

import {
  clearPendingReferralCode,
  getPendingReferralCode,
  getReferralCodeFromBridgeMessage,
  getReferralCodeFromSearch,
  normalizeReferralCode,
  notifyNativeReferralCleared,
  savePendingReferralCode,
} from "../utils/referralCode";

const REFERRAL_SOURCE_STORAGE_KEY = "mlmlive.referralCodeSource";

const getStoredReferralSource = () => {
  try {
    return window.localStorage.getItem(REFERRAL_SOURCE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const storeReferralSource = (source) => {
  try {
    if (source) {
      window.localStorage.setItem(REFERRAL_SOURCE_STORAGE_KEY, source);
    } else {
      window.localStorage.removeItem(REFERRAL_SOURCE_STORAGE_KEY);
    }
  } catch {
    // Local storage may be unavailable in private mode.
  }
};

export function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const verifyState = location.state?.verifyMode ? location.state : null;

  const [step, setStep] = useState(verifyState ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [password, setPassword] = useState("");
  const [otpError, setOtpError] = useState("");

  const [referInput, setReferInput] = useState(() => {
    const queryCode = getReferralCodeFromSearch(window.location.search);
    return queryCode || getPendingReferralCode() || "MLM300";
  });

  const [isReferralLocked, setIsReferralLocked] = useState(() => {
    const queryCode = getReferralCodeFromSearch(window.location.search);
    const pendingCode = queryCode || getPendingReferralCode();
    const storedSource = getStoredReferralSource();

    /*
     * If the pending code has no source, it probably came from the native
     * WebView before the signup screen opened. Therefore, it will be treated
     * as an automatically applied referral code.
     *
     * Codes entered manually are marked as "manual" and remain editable.
     */
    return Boolean(pendingCode && (queryCode || storedSource !== "manual"));
  });

  const [sessionId, setSessionId] = useState(verifyState?.sessionId || "");

  const [userMobile, setUserMobile] = useState(verifyState?.mobile || "");

  /*
   * Referral code can arrive from:
   * 1. Website/deep-link query
   * 2. Expo React Native WebView
   * 3. Google Play Install Referrer
   */
  useEffect(() => {
    const queryCode = getReferralCodeFromSearch(location.search);

    if (queryCode) {
      setReferInput(savePendingReferralCode(queryCode));
      setIsReferralLocked(true);
      storeReferralSource("automatic");
    }

    const acceptReferralCode = (rawMessage) => {
      const code = getReferralCodeFromBridgeMessage(rawMessage);

      if (!code) return;

      setReferInput(savePendingReferralCode(code));
      setIsReferralLocked(true);
      storeReferralSource("automatic");
      setFormError("");
    };

    const handleWindowMessage = (event) => {
      acceptReferralCode(event.data);
    };

    const handleReferralEvent = (event) => {
      acceptReferralCode(event.detail);
    };

    window.addEventListener("message", handleWindowMessage);

    // Some Android WebView versions dispatch messages on document.
    document.addEventListener("message", handleWindowMessage);

    window.addEventListener("mlmlive:referral-code", handleReferralEvent);

    return () => {
      window.removeEventListener("message", handleWindowMessage);

      document.removeEventListener("message", handleWindowMessage);

      window.removeEventListener("mlmlive:referral-code", handleReferralEvent);
    };
  }, [location.search]);

  // STEP 1: Send signup OTP
  const onSignupSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value.toString().trim();
    });

    if (!/^[0-9]{4}$/.test(password)) {
      setFormError("Please add a valid 4-digit password / कृपया सही 4 अंकों का पासवर्ड जोड़ें");
      return;
    }

    try {
      setLoading(true);
      setFormError("");

      const result = await signupInit(
        data.name,
        data.mobile,
        password,
        referInput,
      );

      setSessionId(result.sessionId);
      setUserMobile(data.mobile);
      setStep(2);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const onVerifyOtp = async () => {
    if (enteredOtp.length < 4) {
      setOtpError("Please enter the 4-digit OTP");
      return;
    }

    try {
      setLoading(true);
      setOtpError("");
      setAuthFlowPending(true);

      let result;

      if (verifyState) {
        result = await verifyUser(sessionId, enteredOtp);
      } else {
        result = await signupVerify(sessionId, enteredOtp);
      }

      setUser(result.user, true);

      // Clear referral only after successful signup.
      clearPendingReferralCode();
      storeReferralSource("");

      notifyNativeReferralCleared("REFERRAL_CODE_CONSUMED");

      clearCompanyProfileStorage();

      if (result.mlmProfile) {
        saveMlmProfileToStorage(result.mlmProfile);

        toast.success("Account created! Welcome to MLM LIVE 🎉");

        navigate("/");
      } else {
        toast.success("Account created! Welcome to MLM LIVE 🎉");

        navigate("/selectcomp");
      }
    } catch (error) {
      setOtpError(getAuthErrorMessage(error));
      setEnteredOtp("");
    } finally {
      setAuthFlowPending(false);
      setLoading(false);
    }
  };

  // Resend OTP
  const onResendOtp = async () => {
    try {
      setLoading(true);
      setOtpError("");

      const type = verifyState ? "login_verify" : "signup";

      await resendOtp(sessionId, type);

      alert("OTP resent successfully!");
    } catch (error) {
      setOtpError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ["", "Create Account", "Verify OTP"];

  const stepSubs = ["", "Join MLM LIVE today", `OTP sent to +91 ${userMobile}`];

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      <div className="relative h-[240px] md:h-[280px] bg-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-[#1a3a8f] to-[#0a1744]" />

        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />

        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 px-6">
          <div className="w-16 h-16 bg-white rounded-[18px] shadow-2xl flex items-center justify-center border-2 border-white/20 p-2">
            <img
              src={logo}
              alt="MLM LIVE"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-white font-display font-bold text-2xl leading-tight">
              {stepTitles[step]}
            </h1>

            <p className="text-white/70 text-sm mt-1 font-medium">
              {stepSubs[step]}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {[1, 2].map((currentStep) => (
              <div
                key={currentStep}
                className={`rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-[32px]" />
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-2 pb-8 bg-background -mt-1">
        <div className="w-full max-w-sm">
          {/* STEP 1: Registration form */}
          {step === 1 && (
            <Form
              className="flex w-full flex-col gap-5"
              onSubmit={onSignupSubmit}
            >
              <TextField name="name" type="text" className="w-full">
                <Label className="font-semibold text-sm text-foreground/80 mb-1.5 block">
                  Full Name / पूरा नाम
                </Label>

                <Input
                  className="w-full"
                  classNames={{
                    inputWrapper:
                      "h-13 bg-white dark:bg-black/20 border border-border hover:border-accent focus-within:!border-accent focus-within:!ring-accent shadow-sm rounded-xl",
                    input: "text-base font-medium",
                  }}
                  placeholder="Enter your full name"
                />

                <FieldError className="text-danger mt-1 text-xs" />
              </TextField>

              <TextField name="mobile" type="tel" className="w-full">
                <Label className="font-semibold text-sm text-foreground/80 mb-1.5 block">
                  Mobile Number / मोबाइल नंबर
                </Label>

                <Input
                  className="w-full"
                  classNames={{
                    inputWrapper:
                      "h-13 bg-white dark:bg-black/20 border border-border hover:border-accent focus-within:!border-accent focus-within:!ring-accent shadow-sm rounded-xl",
                    input: "text-base font-medium tracking-wide",
                  }}
                  placeholder="10-digit number"
                  maxLength={10}
                  autoComplete="username"
                  inputMode="numeric"
                  autoCapitalize="none"
                />

                <FieldError className="text-danger mt-1 text-xs" />
              </TextField>

              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="signup-password" className="font-semibold text-sm text-foreground/80 mb-1.5 block">
                  Add Your Password / अपना पासवर्ड जोड़ें
                </Label>

                <input
                  id="signup-password"
                  name="pin"
                  value={password}
                  onChange={(event) => setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  type="password"
                  placeholder="Add 4-digit password / 4 अंकों का पासवर्ड"
                  autoComplete="new-password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  className="w-full h-13 rounded-xl border border-border bg-white px-4 text-base font-medium outline-none shadow-sm focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-black/20"
                />
              </div>

              {/* Referral code field */}
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="font-semibold text-sm text-foreground/80">
                    Coupon Code / कूपन कोड
                  </Label>

                  <span
                    className={`font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      isReferralLocked
                        ? "text-accent bg-accent/10"
                        : "text-muted-foreground bg-muted"
                    }`}
                  >
                    {isReferralLocked ? "Detected · Editable" : "Editable"}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="User or Marketing refer code"
                  maxLength={8}
                  value={referInput}
                  onChange={(event) => {
                    const code = normalizeReferralCode(event.target.value);

                    setReferInput(code);

                    if (code) {
                      savePendingReferralCode(code);
                      storeReferralSource("manual");
                    } else {
                      clearPendingReferralCode();
                      storeReferralSource("");

                      notifyNativeReferralCleared();
                    }

                    setFormError("");
                  }}
                  className="h-13 px-4 border rounded-xl w-full text-base tracking-widest font-mono uppercase outline-none transition-all shadow-sm border-border bg-white dark:bg-black/20 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />

                {isReferralLocked && (
                  <p className="text-[11px] font-medium text-accent mt-1">
                    Coupon code was detected automatically and can still be edited.
                  </p>
                )}
              </div>

              {formError && (
                <div className="bg-danger/10 border border-danger/20 text-danger text-sm text-center py-3 px-4 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <Button
                className="w-full h-13 bg-accent hover:bg-accent/90 text-white font-bold text-base shadow-lg shadow-accent/25 rounded-xl mt-2"
                type="submit"
                isLoading={loading}
              >
                {loading ? "Sending OTP..." : "Continue"}
              </Button>

              <p className="text-center text-sm font-medium text-muted-foreground">
                Already have an account?
                <span
                  onClick={() => navigate("/login")}
                  className="ml-1.5 text-accent font-bold cursor-pointer hover:underline"
                >
                  Login
                </span>
              </p>
            </Form>
          )}

          {/* STEP 2: OTP verification */}
          {step === 2 && (
            <div className="flex w-full flex-col gap-6 pt-2">
              {verifyState && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-accent">
                    आपका अकाउंट verify नहीं हुआ था।
                  </p>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    +91 {userMobile} पर नया OTP भेजा गया है।
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1 w-full">
                <Label className="font-semibold text-sm text-foreground/80 mb-1.5 block text-center">
                  Enter 4-Digit OTP / 4 अंकों का OTP दर्ज करें
                </Label>

                <InputOTP
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(value) => {
                    setEnteredOtp(value);
                  }}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                >
                  <InputOTP.Group className="gap-3 w-full justify-between">
                    {[0, 1, 2, 3].map((index) => (
                      <InputOTP.Slot
                        key={index}
                        index={index}
                        className="flex-1 h-14 text-2xl font-bold bg-white dark:bg-black/20 border border-border data-[focus=true]:border-accent data-[focus=true]:ring-accent shadow-sm rounded-xl"
                      />
                    ))}
                  </InputOTP.Group>
                </InputOTP>
              </div>

              {otpError && (
                <div className="bg-danger/10 border border-danger/20 text-danger text-sm text-center py-3 px-4 rounded-xl font-medium">
                  {otpError}
                </div>
              )}

              <Button
                className="w-full h-13 bg-accent hover:bg-accent/90 text-white font-bold text-base shadow-lg shadow-accent/25 rounded-xl"
                onClick={onVerifyOtp}
                isLoading={loading}
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </Button>

              <div className="flex justify-between items-center px-2">
                <span
                  onClick={() => {
                    if (verifyState) {
                      navigate("/login");
                    } else {
                      setStep(1);
                    }
                  }}
                  className="text-sm text-muted-foreground font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  Back
                </span>

                <span
                  onClick={onResendOtp}
                  className="text-sm text-accent font-bold cursor-pointer hover:underline"
                >
                  Resend OTP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
