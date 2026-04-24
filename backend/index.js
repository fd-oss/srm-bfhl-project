const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── Identity ─────────────────────────────────────────────────────────────────
const USER_ID = "yourname_ddmmyyyy";          // TODO: replace with fullname_ddmmyyyy
const EMAIL_ID = "yourname@srmist.edu.in";    // TODO: replace with your college email
const COLLEGE_ROLL = "RA2111000000000";        // TODO: replace with your roll number

// ── Validation ───────────────────────────────────────────────────────────────
function isValidEdge(raw) {
  const s = raw.trim();
  // Pattern: single uppercase letter -> single uppercase letter
  return /^[A-Z]->[A-Z]$/.test(s);
}

// ── Core Processing ───────────────────────────────────────────────────────────
function processData(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const validEdges = [];

  for (const entry of data) {
    const trimmed = typeof entry === 'string' ? entry.trim() : String(entry).trim();

    if (!isValidEdge(trimmed)) {
      invalidEntries.push(trimmed === '' ? entry : trimmed);
      continue;
    }

    // Self-loop check (already handled by regex since A->A won't match... actually it does)
    const [parent, child] = trimmed.split('->');
    if (parent === child) {
      invalidEntries.push(trimmed);
      continue;
    }

    if (seenEdges.has(trimmed)) {
      // Only push first duplicate occurrence
      if (!duplicateEdges.includes(trimmed)) {
        duplicateEdges.push(trimmed);
      }
    } else {
      seenEdges.add(trimmed);
      validEdges.push([parent, child]);
    }
  }

  // ── Build adjacency: diamond/multi-parent => first-encountered parent wins
  const parentOf = new Map();   // child -> parent (first encounter wins)
  const childrenOf = new Map(); // parent -> [children]
  const allNodes = new Set();

  for (const [p, c] of validEdges) {
    allNodes.add(p);
    allNodes.add(c);
    if (!childrenOf.has(p)) childrenOf.set(p, []);

    if (!parentOf.has(c)) {
      // First parent edge for this child — accept it
      parentOf.set(c, p);
      childrenOf.get(p).push(c);
    }
    // else: subsequent parent edge silently discarded
  }

  // ── Find connected components (union-find)
  const nodeArr = [...allNodes];
  const uf = {};
  nodeArr.forEach(n => (uf[n] = n));

  function find(x) {
    if (uf[x] !== x) uf[x] = find(uf[x]);
    return uf[x];
  }
  function union(a, b) {
    uf[find(a)] = find(b);
  }

  for (const [p, c] of validEdges) union(p, c);

  const groups = new Map();
  for (const n of nodeArr) {
    const root = find(n);
    if (!groups.has(root)) groups.set(root, new Set());
    groups.get(root).add(n);
  }

  // ── Process each group
  const hierarchies = [];

  for (const group of groups.values()) {
    const groupNodes = [...group];

    // Find roots: nodes that never appear as a child (within this group)
    const childNodes = new Set();
    for (const n of groupNodes) {
      if (parentOf.has(n)) childNodes.add(n);
    }
    const roots = groupNodes.filter(n => !childNodes.has(n));

    // Detect cycle using DFS
    function hasCycle(startNodes) {
      const visited = new Set();
      const stack = new Set();

      function dfs(node) {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;
        visited.add(node);
        stack.add(node);
        for (const child of (childrenOf.get(node) || [])) {
          if (dfs(child)) return true;
        }
        stack.delete(node);
        return false;
      }

      for (const n of startNodes) {
        if (dfs(n)) return true;
      }
      return false;
    }

    const cycleDetected = hasCycle(roots.length > 0 ? roots : groupNodes);

    if (cycleDetected || roots.length === 0) {
      // Pure cycle or cycle within group
      const cycleRoot = groupNodes.sort()[0]; // lexicographically smallest
      hierarchies.push({
        root: cycleRoot,
        tree: {},
        has_cycle: true
      });
    } else {
      // Build tree for each actual root (usually one)
      for (const r of roots.sort()) {
        function buildTree(node) {
          const obj = {};
          for (const child of (childrenOf.get(node) || [])) {
            obj[child] = buildTree(child);
          }
          return obj;
        }

        function calcDepth(node) {
          const kids = childrenOf.get(node) || [];
          if (kids.length === 0) return 1;
          return 1 + Math.max(...kids.map(calcDepth));
        }

        const tree = { [r]: buildTree(r) };
        const depth = calcDepth(r);

        hierarchies.push({ root: r, tree, depth });
      }
    }
  }

  // ── Sort hierarchies: non-cycle first then cycle, then by root alpha
  hierarchies.sort((a, b) => {
    if (a.has_cycle && !b.has_cycle) return 1;
    if (!a.has_cycle && b.has_cycle) return -1;
    return a.root.localeCompare(b.root);
  });

  // ── Summary
  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic = hierarchies.filter(h => h.has_cycle);

  let largestRoot = '';
  if (nonCyclic.length > 0) {
    let best = nonCyclic[0];
    for (const h of nonCyclic) {
      if (h.depth > best.depth || (h.depth === best.depth && h.root < best.root)) {
        best = h;
      }
    }
    largestRoot = best.root;
  }

  const summary = {
    total_trees: nonCyclic.length,
    total_cycles: cyclic.length,
    largest_tree_root: largestRoot
  };

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array' });
    }
    const result = processData(data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => res.json({ status: 'BFHL API is running. POST to /bfhl' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
