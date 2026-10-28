// src/pages/TokensPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import {
  purchaseTokens,
  getPaymentStatus,
  listPackages,
  getBalance,
} from "../api/payments";

export default function TokensPage({ onTokensChanged }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [balance, setBalance] = useState(null);
  const [packages, setPackages] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [returnedTxId, setReturnedTxId] = useState(null);

  // 1. Load balance + packages on mount
  useEffect(() => {
    let alive = true;
    getBalance()
      .then((d) => alive && setBalance(d.remaining_tokens))
      .catch(() => {});
    listPackages()
      .then((d) => alive && setPackages(Array.isArray(d) ? d : []))
      .catch(() => alive && setPackages([]));
    return () => {
      alive = false;
    };
  }, []);

  // 2. If we came back from a Pesapal redirect, poll the tx status
  useEffect(() => {
    const txId =
      params.get("transaction_id") || localStorage.getItem("pending_tx");
    if (!txId) return;

    setReturnedTxId(txId);
    let alive = true;
    let polls = 0;

    const check = async () => {
      polls += 1;
      try {
        const data = await getPaymentStatus(txId);
        if (!alive) return;

        if (data.status === "SUCCESS") {
          localStorage.removeItem("pending_tx");
          onTokensChanged?.();
          const bal = await getBalance();
          setBalance(bal.remaining_tokens);
          return;
        }
        if (data.status === "FAILED") {
          localStorage.removeItem("pending_tx");
          setError("Payment failed. Please try again.");
          return;
        }
        if (polls < 30) setTimeout(check, 2000);
      } catch {
        if (polls < 30) setTimeout(check, 2000);
      }
    };

    check();
    return () => {
      alive = false;
    };
  }, [params, onTokensChanged]);

  const handleBuy = async (pkg) => {
    setError(null);
    setBusyId(pkg.id);
    try {
      const data = await purchaseTokens({ package_id: pkg.id });
      if (data.payment_url) {
        // Remember the transaction so we can poll when we come back
        localStorage.setItem("pending_tx", String(data.transaction_id));
        window.location.href = data.payment_url;
      } else {
        setError("No payment URL returned by the server.");
        setBusyId(null);
      }
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Could not start payment. Please try again."
      );
      setBusyId(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", mt: 4, px: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            AI Tokens
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Buy tokens to run AI evaluations and grading.
          </Typography>
        </Box>
        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BoltRoundedIcon sx={{ color: "primary.main" }} />
          <Typography variant="subtitle2">Current balance</Typography>
          <Chip
            label={
              balance != null ? `${balance.toLocaleString()} tokens` : "—"
            }
            color="primary"
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Paper>

      {returnedTxId && !error && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          icon={<CircularProgress size={16} />}
        >
          Confirming your payment… Transaction #{returnedTxId}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {packages.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No token packages are available right now.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {packages.map((pkg) => {
            const busy = busyId === pkg.id;
            return (
              <Grid item xs={12} md={4} key={pkg.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {pkg.name}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
                      {pkg.tokens.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      tokens
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      UGX {(pkg.price_cents / 100).toLocaleString()}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={busy}
                    startIcon={
                      busy ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <BoltRoundedIcon />
                      )
                    }
                    onClick={() => handleBuy(pkg)}
                  >
                    {busy ? "Redirecting…" : "Buy now"}
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}