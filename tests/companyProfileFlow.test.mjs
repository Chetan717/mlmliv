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

const projectRoot = resolve(import.meta.dirname, "..");
const read = (relativePath) =>
  readFileSync(join(projectRoot, relativePath), "utf8");

function createStorage(entries) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
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

test("Select Company uses refresh, deferred search and scroll batching", () => {
  const source = read("src/pages/SelectCompany/SelectComp.jsx");
  assert.match(source, /aria-label="Refresh company list"/);
  assert.match(source, /useDeferredValue\(search\)/);
  assert.match(source, /new IntersectionObserver/);
  assert.match(source, /COMPANY_BATCH_SIZE/);
  assert.match(source, /visibleCompanies\.map/);
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
