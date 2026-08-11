import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("login and registration use one bilingual password field", () => {
  const login = read("src/Auth/Login.jsx");
  const signup = read("src/Auth/Signup.jsx");

  assert.match(login, /Enter Your Password \/ अपना पासवर्ड दर्ज करें/);
  assert.match(login, /id="login-password"/);
  assert.doesNotMatch(login, /InputOTP\.Slot/);
  assert.match(signup, /Add Your Password \/ अपना पासवर्ड जोड़ें/);
  assert.match(signup, /id="signup-password"/);
  assert.match(signup, /getPendingReferralCode\(\) \|\| "MLM300"/);
  assert.doesNotMatch(signup, /disabled=\{isReferralLocked\}/);
});

test("MLM profile has bilingual rank and full-strip upload controls", () => {
  const profile = read("src/pages/Form/Mlmprofilemodal.jsx");
  const picker = read("src/pages/Form/MultiImagePicker.jsx");

  assert.match(profile, /Select Rank \/ रैंक चुनें/);
  assert.match(profile, /list="company-rank-options"/);
  assert.doesNotMatch(profile, />\s*or\s*</i);
  assert.match(profile, /Add Top Upline\/Seniors Image \/ टॉप अपलाइन\/सीनियर्स की फोटो जोड़ें/);
  assert.match(profile, /Add Profile Photo \/ प्रोफाइल फोटो जोड़ें/);
  assert.match(profile, /bg-background text-foreground cursor-not-allowed/);
  assert.match(profile, /aria-label="Add profile photo"/);
  assert.match(picker, /aria-label="Add top upline or senior image"/);
});
