import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  COMPANY_BATCH_SIZE,
  filterCompaniesByName,
  getCompanyBatch,
  getNextCompanyCount,
} from "../src/pages/SelectCompany/companyListUtils.js";
import {
  clearCompanyScopedStorage,
  COMPANY_SCOPED_STORAGE_KEYS,
} from "../src/utils/companyStorage.js";
import {
  clearPendingCompanySelection,
  readPendingCompanySelection,
  savePendingCompanySelection,
} from "../src/utils/companySelectionStorage.js";
import {
  canChangeCompanyBeforeProfile,
  getCompanySelectionDestination,
  isCompanyChangeRequest,
} from "../src/utils/companyChangePolicy.js";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath) =>
  readFileSync(join(projectRoot, relativePath), "utf8");

function createStorage(entries) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
}

test("company directory searches the full list and renders 14-item batches", () => {
  const companies = Array.from({ length: 40 }, (_, index) => ({
    id: `${index + 1}`,
    name: index === 31 ? "Ánvik International" : `Company ${index + 1}`,
  }));

  assert.equal(COMPANY_BATCH_SIZE, 14);
  assert.equal(getCompanyBatch(companies, COMPANY_BATCH_SIZE).length, 14);
  assert.equal(getNextCompanyCount(14, companies.length), 28);
  assert.equal(getNextCompanyCount(28, companies.length), 40);
  assert.equal(filterCompaniesByName(companies, "  anvik ")[0].id, "32");
});

test("company-profile deletion clears company data but preserves login preferences", () => {
  const companyData = Object.fromEntries(
    COMPANY_SCOPED_STORAGE_KEYS.map((key) => [key, `saved:${key}`]),
  );
  const local = createStorage({
    ...companyData,
    theme: "dark",
    onboardingDone: "1",
    "mlmlive-manual-logout": "0",
  });
  const session = createStorage({ ...companyData, authSession: "verified" });

  clearCompanyScopedStorage({ local, session });

  for (const key of COMPANY_SCOPED_STORAGE_KEYS) {
    assert.equal(local.getItem(key), null, `${key} remained in localStorage`);
    assert.equal(session.getItem(key), null, `${key} remained in sessionStorage`);
  }
  assert.equal(local.getItem("theme"), "dark");
  assert.equal(local.getItem("onboardingDone"), "1");
  assert.equal(session.getItem("authSession"), "verified");
});

test("pending company selection is UID-scoped and survives a blocked local store", () => {
  const session = createStorage({});
  const blockedLocal = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
    removeItem: () => { throw new Error("blocked"); },
  };
  const stores = [blockedLocal, session];

  assert.equal(savePendingCompanySelection("uid-1", "company-9", { stores }), true);
  assert.equal(readPendingCompanySelection("uid-1", { stores }), "company-9");
  assert.equal(readPendingCompanySelection("uid-2", { stores }), null);

  clearPendingCompanySelection("uid-1", { stores });
  assert.equal(readPendingCompanySelection("uid-1", { stores }), null);
});

test("company selection does not depend on the unsupported Firestore collection", () => {
  const context = read("src/Context/SelectedCompanyContext.jsx");
  assert.doesNotMatch(context, /userCompanySelections/);
  assert.match(context, /savePendingCompanySelection\(user\.uid, company\.id\)/);
  assert.match(context, /verifiedProfile\?\.companyId/);
  assert.doesNotMatch(context, /setDoc\(selectionRef/);
});

test("company can change only before the first MLM Profile is created", () => {
  assert.equal(isCompanyChangeRequest("?mode=change"), true);
  assert.equal(isCompanyChangeRequest(""), false);
  assert.equal(getCompanySelectionDestination("?mode=change"), "/mlmprofile");
  assert.equal(getCompanySelectionDestination(""), "/");
  assert.equal(
    canChangeCompanyBeforeProfile({
      profileLookupState: "missing",
      existingDocId: null,
    }),
    true,
  );
  assert.equal(
    canChangeCompanyBeforeProfile({
      profileLookupState: "existing",
      existingDocId: "profile-1",
    }),
    false,
  );
  assert.equal(
    canChangeCompanyBeforeProfile({
      profileLookupState: "error",
      existingDocId: null,
    }),
    false,
    "a failed server lookup must keep company change locked",
  );

  const profileForm = read("src/pages/Form/Mlmprofilemodal.jsx");
  assert.match(profileForm, /canChangeCompany && \(/);
  assert.match(profileForm, /aria-label="Change Company \/ कंपनी बदलें"/);
  assert.match(profileForm, /navigate\("\/selectcomp\?mode=change"\)/);
  assert.match(profileForm, /setProfileLookupState\("existing"\)/);
  assert.match(profileForm, /setProfileLookupState\("missing"\)/);
  assert.match(profileForm, /setProfileLookupState\("error"\)/);

  const routeGuard = read("src/pages/SelectCompany/ProtectSelectComp.jsx");
  assert.match(routeGuard, /isCompanyChangeRequest\(location\.search\)/);
  assert.match(routeGuard, /getVerifiedMlmProfile\(user\.uid, mobile\)/);
  assert.match(routeGuard, /changeAccess === "locked"/);
  assert.match(routeGuard, /<Navigate to="\/mlmprofile" replace \/>/);

  const context = read("src/Context/SelectedCompanyContext.jsx");
  const verifyIndex = context.indexOf("const verifiedProfile = await getVerifiedMlmProfile");
  const pendingSaveIndex = context.indexOf(
    "savePendingCompanySelection(user.uid, company.id)",
  );
  assert.ok(verifyIndex >= 0 && verifyIndex < pendingSaveIndex);
  assert.match(context, /error\.code = COMPANY_SELECTION_LOCKED_CODE/);

  const selectCompany = read("src/pages/SelectCompany/SelectComp.jsx");
  assert.match(selectCompany, /getCompanySelectionDestination\(location\.search\)/);
  assert.match(selectCompany, /replace: isChangeMode/);
});

test("Select Company uses refresh, deferred search and scroll batching", () => {
  const source = read("src/pages/SelectCompany/SelectComp.jsx");
  assert.match(source, /aria-label="Refresh company list"/);
  assert.match(source, /useDeferredValue\(search\)/);
  assert.match(source, /new IntersectionObserver/);
  assert.match(source, /COMPANY_BATCH_SIZE/);
  assert.match(source, /visibleCompanies\??\.map/);
});

test("My Profile is accessible before MLM profile creation and unifies editing", () => {
  const app = read("src/App.jsx");
  const profileRoute = app.match(/path="\/profile"[\s\S]*?\n\s*\/>/)?.[0] || "";
  assert.ok(profileRoute);
  assert.doesNotMatch(profileRoute, /ProtectMlmProfile requireProfile/);

  const profile = read("src/pages/Profile/Myprofile.jsx");
  assert.match(profile, /profileData\.companyName \|\| selectedCompany\?\.name/);
  assert.match(profile, /navigate\("\/mlmprofile"\)/);
  assert.match(profile, /isCompanyProfile \? "Edit Profile" : "Edit Name"/);

  const tabBar = read("src/components/TabBar.jsx");
  const sidebar = read("src/components/Sidebar.jsx");
  assert.match(tabBar, /label: "My Profile"/);
  assert.match(sidebar, /label: "My Profile"/);
  assert.match(sidebar, /link: "\/profile"/);
});

test("selected-company logo edit and delete redirect are production-safe", () => {
  const header = read("src/components/Header.jsx");
  assert.match(header, /getCompanyLogoUrl\(selectedCompany\)/);
  assert.match(header, /aria-label="Edit company profile"/);

  const profileForm = read("src/pages/Form/Mlmprofilemodal.jsx");
  const deleteHandler = profileForm.match(
    /const handleDeleteConfirm[\s\S]*?\/\/ ═+/,
  )?.[0] || "";
  assert.match(deleteHandler, /navigate\("\/selectcomp", \{ replace: true \}\)/);
  assert.doesNotMatch(deleteHandler, /navigate\("\/logout"/);

  const context = read("src/Context/SelectedCompanyContext.jsx");
  assert.match(context, /clearCompanyScopedStorage\(\)/);
  assert.match(context, /invalidateVerifiedMlmProfileCache\(\)/);
});
