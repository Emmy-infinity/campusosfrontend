import { useEffect, useState } from "react";
import Chip from "@mui/material/Chip";
import BoltIcon from "@mui/icons-material/Bolt";
import { getTokenBalance } from "../api/ai";

export default function TokenBalance({ refreshKey = 0 }) {
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    let alive = true;
    getTokenBalance()
      .then((d) => alive && setTokens(d.remaining_tokens))
      .catch(() => {});
    return () => { alive = false; };
  }, [refreshKey]);

  if (tokens === null) return null;
  return (
    <Chip
      icon={<BoltIcon />}
      label={`${(tokens ?? 0).toLocaleString()} tokens`}
      color="secondary"
      variant="outlined"
      size="small"
    />
  );
}
