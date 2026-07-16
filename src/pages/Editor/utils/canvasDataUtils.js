export function processProfileData(mlmForm, mlmProfile) {
  const profileName = mlmForm?.promoter?.name
    ? mlmForm.promoter.name
    : mlmProfile?.fullName || "";

  const profileMobile = mlmForm?.promoter?.name
    ? mlmForm.promoter.mobile
    : mlmProfile?.mobile || "";

  const designation = mlmForm?.promoter?.name
    ? mlmForm.promoter.role
    : mlmProfile?.designation || "";

  const socialURLs = mlmProfile?.socials || {};
  const socialText =
    socialURLs.Youtube ||
    socialURLs.Instagram ||
    socialURLs.Facebook ||
    socialURLs.X ||
    "";

  const availableSocials = [
    socialURLs.Youtube ? "youtube" : null,
    socialURLs.Instagram ? "instagram" : null,
    socialURLs.Facebook ? "facebook" : null,
    socialURLs.X ? "x" : null,
  ].filter(Boolean);

  return {
    profileName: profileName?.toUpperCase() || "PROFILENAME",
    profileMobile,
    designation: designation?.toUpperCase() || "DESIGNATION",
    socialURLs,
    socialText,
    availableSocials,
  };
}

export function processFormData(mlmForm) {
  return {
    formName: mlmForm?.achiever?.name || "",
    formCity: mlmForm?.achiever?.city || "",
    formAmount: mlmForm?.achiever?.amount || "",
  };
}

export function calculateFontSizes(profileName, designation) {
  let profileFontSize = 10;
  if (profileName?.length > 10 && profileName?.length <= 19) {
    profileFontSize = 7;
  } else if (profileName?.length > 19) {
    profileFontSize = 6;
  }

  let designationFontSize = 8;
  if (designation?.length > 10 && designation?.length <= 19) {
    designationFontSize = 6;
  } else if (designation?.length > 19) {
    designationFontSize = 5;
  }

  return {
    profileFontSize,
    designationFontSize,
  };
}