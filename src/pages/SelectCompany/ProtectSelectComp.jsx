import { Navigate } from "react-router";
import { useAuth } from "../../Auth/AuthContext";
import { hasMlmProfileInStorage } from "../../utils/companyStorage";
import { useSelectedCompany } from "../../Context/SelectedCompanyContext";

export default function ProtectSelectComp({ children }) {
  const { user, loading } = useAuth();
  const { selectedCompany, loading: companyLoading } = useSelectedCompany();
  const hasMlmProfile = hasMlmProfileInStorage();

  if (loading || companyLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (hasMlmProfile || selectedCompany) {
    return <Navigate to="/" replace />;
  }

  return children;
}
