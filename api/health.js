cat > api/health.js <<'EOF'
export default function handler(req, res) {
  res.status(200).json({ ok: true });
}
EOF
