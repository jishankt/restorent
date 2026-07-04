import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../Redux/Slices/userSlice";
import axios from "axios";

function BearerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 1. Determine local POS Base URL
      let baseUrl = "";
      try {
        const netRes = await axios.get("/api/network_info");
        if (netRes.data?.config?.mode === "client") {
          baseUrl = `http://${netRes.data.config.server_ip}:6034`;
        }
      } catch (err) {
        console.error("Network info fetch failed:", err);
      }

      // 2. Perform ERPNext Login
      const response = await fetch("http://109.199.100.136:6060/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.bearer_login", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const { message, user, session, pos_profile } = data;

      // Update Redux and LocalStorage
      dispatch(
        loginSuccess({
          user,
          session,
          pos_profile,
          message,
        })
      );

      localStorage.setItem("session", session || "");
      localStorage.setItem("pos_profile", pos_profile || "");
      localStorage.setItem("user", JSON.stringify(user || {}));
      localStorage.setItem("allowed_item_groups", JSON.stringify(message?.allowed_item_groups || []));
      localStorage.setItem("allowed_customer_groups", JSON.stringify(message?.allowed_customer_groups || []));
      localStorage.setItem("filtered_items", JSON.stringify(message?.filtered_items || []));
      localStorage.setItem("filtered_customers", JSON.stringify(message?.filtered_customers || []));
      
      const companyName = user.company_name || user.company;
      const branchName = user.branch_name || user.branch;
      if (companyName) localStorage.setItem("active_company", companyName);
      if (branchName) localStorage.setItem("active_branch", branchName);

      // 3. Fetch Workflow Visibility Settings to respect "Manages" configuration
      let workflowSettings = {};
      try {
        const workflowRes = await axios.get(`${baseUrl}/api/workflow-visibility`, {
          params: {
            company: companyName,
            branch: (branchName && branchName !== "All Branches") ? branchName : undefined
          }
        });
        workflowSettings = workflowRes.data.settings || {};
        console.log("Workflow Settings Fetched:", workflowSettings);
      } catch (err) {
        console.error("Workflow fetch failed:", err);
      }

      // Check if Opening Entry is disabled in the workflow
      const g = workflowSettings.global_modules;
      // CRITICAL: We strictly check for 'false'. If undefined or true, it stays enabled.
      const isOpeningEntryEnabled = g?.pos_billing?.enabled !== false && g?.pos_billing?.pages?.OpeningEntry !== false;
      
      console.log("Redirection Check -> isOpeningEntryEnabled:", isOpeningEntryEnabled);

      if (!isOpeningEntryEnabled) {
        console.log("Opening Entry is DISABLED in Manages. Redirecting to /home");
        navigate("/home");
        return;
      }

      // 4. Check for Active Opening Entry on Local POS Backend (STRICT CHECK)
      try {
        const checkUrl = `${baseUrl}/api/get_pos_opening_entries`;
        const openingRes = await axios.post(checkUrl, { 
          pos_profile: pos_profile || "POS-001",
          userId: user.email || user.username,
          role: user.role
        }, {
          headers: {
            'X-Company-Name': companyName || 'All',
            'X-Branch-Name': branchName || 'All'
          }
        });
        
        const openEntries = openingRes.data?.message || [];
        console.log("Backend Session Check Response:", openingRes.data);
        
        const userIdentifier = user.username || (user.email ? user.email.split('@')[0] : 'Guest');
        const activeEntries = openEntries.filter(entry => 
          entry.status === 'Open' && entry.user === userIdentifier
        );
        console.log(`Active Sessions Found for ${userIdentifier}: ${activeEntries.length}`);

        if (activeEntries.length > 0) {
          const activeEntry = activeEntries[0];
          console.log("Active Session Detected:", activeEntry.name, "-> Redirecting to /home");
          localStorage.setItem("openingEntryName", activeEntry.name);
          localStorage.setItem("posOpeningEntry", activeEntry.name);
          navigate("/home");
        } else {
          console.log("No Active Session Found. Checking permissions for /opening-entry");
          localStorage.removeItem("openingEntryName");
          localStorage.removeItem("posOpeningEntry");
          
          // STRICT CHECK: Does user have explicit permission for Opening Entry?
          let isOpeningAllowed = false;
          try {
            const rolePermRes = await axios.get(`${baseUrl}/api/role-permissions?role=${encodeURIComponent(userRole)}&t=${Date.now()}`, {
              headers: {
                'X-Company-Name': companyName || 'All',
                'X-Branch-Name': branchName || 'All'
              }
            });
            const perms = rolePermRes.data.permissions || [];
            const hasAllPerm = perms.some(p => p.pageId === 'all');
            const openingPerm = perms.find(p => p.pageId === 'opening');
            
            if (hasAllPerm) {
              isOpeningAllowed = true;
            } else if (openingPerm && (openingPerm.canRead === true || openingPerm.canRead === 'true')) {
              isOpeningAllowed = true;
            }
          } catch (permErr) {
            console.error("BearerLogin: Failed to fetch role permissions", permErr);
            isOpeningAllowed = false; // Fail secure
          }

          if (!isOpeningAllowed) {
            console.log("User lacks Opening Entry permission. Bypassing Opening Entry requirement -> /home");
            navigate("/home");
            return;
          }

          navigate("/opening-entry");
        }
      } catch (err) {
        console.error("Opening entry check failed:", err);
        // Fallback to Home if there's an error, because forced opening entry on error is risky if they lack permissions
        navigate("/home");
      }

    } catch (err) {
      setErrorMessage(err.message);
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
          {errorMessage && <div style={styles.errorMessage}>{errorMessage}</div>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f9" },
  loginBox: { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", width: "100%", maxWidth: "400px" },
  title: { fontSize: "1.5em", marginBottom: "20px", color: "#333", textAlign: "center" },
  form: { display: "flex", flexDirection: "column" },
  formGroup: { marginBottom: "15px" },
  label: { fontSize: "14px", marginBottom: "5px", color: "#555" },
  input: { width: "100%", padding: "10px", fontSize: "14px", border: "1px solid #ccc", borderRadius: "5px", outline: "none" },
  button: { width: "100%", padding: "10px", backgroundColor: "#007bff", border: "none", color: "white", fontSize: "16px", borderRadius: "5px", cursor: "pointer" },
  errorMessage: { marginTop: "10px", color: "red", fontSize: "14px", textAlign: "center" },
};

export default BearerLogin;
