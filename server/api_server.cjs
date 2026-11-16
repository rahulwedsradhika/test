const http = require('http');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');

const PORT = process.env.API_PORT || 5168;

function resolveDbPath(filename) {
  const localData = path.resolve(__dirname, '../data', filename);
  const parentData = path.resolve(__dirname, '../../data', filename);

  let target = parentData;
  if (fs.existsSync(parentData) && fs.statSync(parentData).size > 0) {
    target = parentData;
  } else if (fs.existsSync(localData) && fs.statSync(localData).size > 0) {
    target = localData;
  } else if (fs.existsSync(parentData)) {
    target = parentData;
  } else {
    target = localData;
  }

  // Auto-decompress if only .gz exists
  if ((!fs.existsSync(target) || fs.statSync(target).size === 0) && fs.existsSync(target + '.gz')) {
    console.log(`[API Server] Decompressing ${filename}.gz (GitHub-safe archive)...`);
    const zlib = require('zlib');
    const compressed = fs.readFileSync(target + '.gz');
    const decompressed = zlib.gunzipSync(compressed);
    fs.writeFileSync(target, decompressed);
    console.log(`[API Server] Successfully unpacked ${filename} (${(decompressed.length / (1024*1024)).toFixed(1)} MB)!`);
  }
  return target;
}

const fs = require('fs');
const DB_PATH_PHASE1 = resolveDbPath('fresh_samhita_questions.sqlite');
const DB_PATH_PHASE2 = resolveDbPath('phase2_fresh_questions.sqlite');
const DB_PATH_SUBJECTWISE = resolveDbPath('subjectwise_fresh.sqlite');
const DB_PATH_SESSIONS = resolveDbPath('portal_sessions.sqlite');

let phase1Db, phase2Db, subjectwiseDb, sessionsDb;

try {
  phase1Db = new DatabaseSync(DB_PATH_PHASE1);
  console.log('[API Server] Connected to Phase 1 DB (Charaka, Sushruta, Ashtanga Hridaya):', DB_PATH_PHASE1);
} catch (e) {
  console.error('[API Server] Error opening Phase 1 DB:', e.message);
}

try {
  phase2Db = new DatabaseSync(DB_PATH_PHASE2);
  console.log('[API Server] Connected to Phase 2 DB (14 Categories):', DB_PATH_PHASE2);
} catch (e) {
  console.error('[API Server] Error opening Phase 2 DB:', e.message);
}

try {
  subjectwiseDb = new DatabaseSync(DB_PATH_SUBJECTWISE);
  console.log('[API Server] Connected to Phase 3 Subjectwise DB (38 Subjects):', DB_PATH_SUBJECTWISE);
} catch (e) {
  console.error('[API Server] Error opening Subjectwise DB:', e.message);
}

try {
  sessionsDb = new DatabaseSync(DB_PATH_SESSIONS);
  console.log('[API Server] Connected to Sessions DB:', DB_PATH_SESSIONS);
} catch (e) {
  console.error('[API Server] Error opening Sessions DB:', e.message);
}

const DB_PATH_TESTSERIES = resolveDbPath('testseries_fresh.sqlite');
let testseriesDb;

try {
  testseriesDb = new DatabaseSync(DB_PATH_TESTSERIES);
  console.log('[API Server] Connected to Phase 4 Test Series DB (7 Series, 362 Tests):', DB_PATH_TESTSERIES);
} catch (e) {
  console.error('[API Server] Error opening Test Series DB:', e.message);
}
const DB_PATH_TAGWISE = resolveDbPath('tagwise_fresh.sqlite');
let tagwiseDb;
try {
  tagwiseDb = new DatabaseSync(DB_PATH_TAGWISE);
  console.log('[API Server] Connected to Phase 5 Tagwise DB (6 Categories, 9,632 Assignments):', DB_PATH_TAGWISE);
} catch (e) {
  console.error('[API Server] Error opening Tagwise DB:', e.message);
}
const { handleTagwiseRoutes } = require('./tagwise_routes.cjs');

const DB_PATH_PYP = resolveDbPath('previous_years_fresh.sqlite');
let pypDb;
try {
  pypDb = new DatabaseSync(DB_PATH_PYP);
  console.log('[API Server] Connected to Phase 6 Previous Year Papers DB (3 Groups, 127 Tests):', DB_PATH_PYP);
} catch (e) {
  console.error('[API Server] Error opening Previous Year Papers DB:', e.message);
}
const { handlePreviousYearsRoutes } = require('./previous_years_routes.cjs');

const DB_PATH_DAILY = resolveDbPath('daily_tests_fresh.sqlite');
let dailyDb;
try {
  dailyDb = new DatabaseSync(DB_PATH_DAILY);
  console.log('[API Server] Connected to Phase 7 Daily Tests DB (3 Sessions, 90 Tests):', DB_PATH_DAILY);
} catch (e) {
  console.error('[API Server] Error opening Daily Tests DB:', e.message);
}
const { handleDailyTestsRoutes } = require('./daily_tests_routes.cjs');

if (sessionsDb) {
  try {
    sessionsDb.exec(`
      CREATE TABLE IF NOT EXISTS testseries_attempts (
        attempt_id TEXT PRIMARY KEY,
        test_id TEXT NOT NULL,
        series_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        submitted_at TEXT,
        time_spent_seconds INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        answers_json TEXT DEFAULT '{}',
        marked_for_review_json TEXT DEFAULT '[]',
        total_questions INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        unattempted_count INTEGER DEFAULT 0,
        score REAL DEFAULT 0,
        total_marks REAL DEFAULT 0,
        accuracy REAL DEFAULT 0
      );
CREATE TABLE IF NOT EXISTS tagwise_attempts (
        attempt_id TEXT PRIMARY KEY,
        tag_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        submitted_at TEXT,
        time_spent_seconds INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        answers_json TEXT DEFAULT '{}',
        marked_for_review_json TEXT DEFAULT '[]',
        question_uids_json TEXT DEFAULT '[]',
        total_questions INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        unattempted_count INTEGER DEFAULT 0,
        score REAL DEFAULT 0,
        total_marks REAL DEFAULT 0,
        accuracy REAL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS pyp_attempts (
        attempt_id TEXT PRIMARY KEY,
        test_uid TEXT NOT NULL,
        user_id TEXT DEFAULT 'student-guest',
        status TEXT DEFAULT 'in_progress',
        answers_json TEXT DEFAULT '{}',
        marked_for_review_json TEXT DEFAULT '[]',
        time_remaining_seconds INTEGER,
        time_spent_seconds INTEGER DEFAULT 0,
        score REAL DEFAULT 0,
        max_marks REAL DEFAULT 0,
        accuracy_percent REAL DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        unattempted_count INTEGER DEFAULT 0,
        started_at TEXT,
        completed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS daily_attempts (
        attempt_id TEXT PRIMARY KEY,
        test_uid TEXT NOT NULL,
        session_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        saved_at TEXT,
        completed_at TEXT,
        answers_json TEXT NOT NULL DEFAULT '{}',
        score REAL,
        total_questions INTEGER,
        correct_count INTEGER,
        incorrect_count INTEGER,
        unattempted_count INTEGER,
        is_completed INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_daily_attempts_test ON daily_attempts(test_uid, is_completed);
    `);
  } catch (e) {
    console.error('[API Server] Error initializing testseries_attempts table:', e.message);
  }
}


function isSubjectwise(nodeId) {
  if (!nodeId) return false;
  return nodeId.startsWith('SUB-') || nodeId.startsWith('SUBQ-');
}

function isPhase1(nodeId) {
  if (!nodeId) return true;
  return nodeId.startsWith('SAM-01') || nodeId.startsWith('SAM-02') || nodeId.startsWith('SAM-03');
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseUrl(reqUrl) {
  const [pathname, queryString] = reqUrl.split('?');
  const params = new URLSearchParams(queryString || '');
  return { pathname, params };
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.readableEnded) {
      return resolve({});
    }
    let body = '';
    const timer = setTimeout(() => resolve({}), 4000);
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

// -------------------------------------------------------------------
// Unified In-Memory Hierarchy Count Cache across all 17 categories
// -------------------------------------------------------------------
let countCache = null;
let cacheTime = 0;

function getCountCache() {
  const now = Date.now();
  if (countCache && (now - cacheTime < 15000)) {
    return countCache;
  }

  const counts = new Map();
  const allNodes = [];

  // 1. Process Phase 1 DB
  if (phase1Db) {
    const p1LeafRows = phase1Db.prepare(`
      SELECT l.node_id, COUNT(DISTINCT q.question_id) as n
      FROM questions q
      JOIN question_locations l USING (question_id)
      WHERE q.review_state = 'validated'
      GROUP BY l.node_id
    `).all();

    for (const r of p1LeafRows) {
      counts.set(r.node_id, r.n);
    }

    const p1Nodes = phase1Db.prepare(`
      SELECT node_id, parent_node_id, type, display_name_en, display_name_hi, chapter_number, expected_count
      FROM mapping_nodes
      ORDER BY node_id ASC
    `).all();

    for (const n of p1Nodes) {
      allNodes.push({
        node_id: n.node_id,
        parent_node_id: n.parent_node_id,
        type: n.type,
        display_name_en: n.display_name_en,
        display_name_hi: n.display_name_hi,
        chapter_number: n.chapter_number,
        expected_count: n.expected_count,
        navigation_type: 'hierarchical'
      });
    }

    // Resolve parent totals in Phase 1
    function resolveP1Total(nodeId) {
      if (counts.has(nodeId)) {
        return counts.get(nodeId);
      }
      const children = p1Nodes.filter(n => n.parent_node_id === nodeId);
      let sum = 0;
      for (const c of children) {
        sum += resolveP1Total(c.node_id);
      }
      counts.set(nodeId, sum);
      return sum;
    }

    for (const n of p1Nodes) {
      resolveP1Total(n.node_id);
    }
  }

  // 2. Process Phase 2 DB
  if (phase2Db) {
    const p2LeafRows = phase2Db.prepare(`
      SELECT a.leaf_node_id, COUNT(DISTINCT q.question_id) as n
      FROM questions q
      JOIN question_leaf_assignments a ON q.question_id = a.question_id
      WHERE q.state = 'validated' AND a.verified = 1
      GROUP BY a.leaf_node_id
    `).all();

    for (const r of p2LeafRows) {
      counts.set(r.leaf_node_id, r.n);
    }

    const p2Nodes = phase2Db.prepare(`
      SELECT node_id, parent_node_id, root_category_id, node_type, name_en, name_hi, navigation_type, expected_count
      FROM mapping_nodes
      ORDER BY root_category_id ASC, node_id ASC
    `).all();

    for (const n of p2Nodes) {
      allNodes.push({
        node_id: n.node_id,
        parent_node_id: n.parent_node_id,
        root_category_id: n.root_category_id,
        type: n.node_type,
        display_name_en: n.name_en,
        display_name_hi: n.name_hi,
        chapter_number: null,
        expected_count: n.expected_count,
        navigation_type: n.navigation_type
      });
    }

    // Resolve parent totals in Phase 2
    function resolveP2Total(nodeId) {
      if (counts.has(nodeId)) {
        return counts.get(nodeId);
      }
      const children = p2Nodes.filter(n => n.parent_node_id === nodeId);
      let sum = 0;
      for (const c of children) {
        sum += resolveP2Total(c.node_id);
      }
      counts.set(nodeId, sum);
      return sum;
    }

    for (const n of p2Nodes) {
      resolveP2Total(n.node_id);
    }
  }

  countCache = { counts, allNodes };
  cacheTime = now;
  return countCache;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const { pathname, params } = parseUrl(req.url);

  // 1. GET /api/samhitas - Overview of ALL 17 Categories
  if (pathname === '/api/samhitas' && req.method === 'GET') {
    try {
      const { counts, allNodes } = getCountCache();
      const roots = allNodes.filter(n => !n.parent_node_id);

      // Group categories
      const result = roots.map(root => {
        const valCount = counts.get(root.node_id) || 0;
        const rawChildren = allNodes.filter(n => n.parent_node_id === root.node_id);

        const divs = rawChildren.map(d => {
          const divVal = counts.get(d.node_id) || 0;
          const leafCount = allNodes.filter(n => n.parent_node_id === d.node_id).length;

          return {
            id: d.node_id,
            name_en: d.display_name_en,
            name_hi: d.display_name_hi,
            type: d.type,
            expected_count: d.expected_count,
            validated_count: divVal,
            chapter_count: leafCount,
            coverage_percent: Math.min(100, Math.round((divVal / (d.expected_count || 1)) * 100)),
            status: divVal >= (d.expected_count || 0) ? 'ready' : (divVal > 0 ? 'partial' : 'pending')
          };
        });

        // Determine category group
        let group = 'Direct Question Banks';
        if (['SAM-01', 'SAM-02', 'SAM-03'].includes(root.node_id)) {
          group = 'Brihat Trayi (Great Three)';
        } else if (['SAM-04', 'SAM-06', 'SAM-08', 'SAM-09', 'SAM-10', 'SAM-05', 'SAM-07', 'SAM-11', 'SAM-12'].includes(root.node_id)) {
          group = 'Laghutrayi & Classical Samhitas';
        } else if (['SAM-13', 'SAM-14', 'SAM-15', 'SAM-16'].includes(root.node_id)) {
          group = 'Rasashastra & Bhaishajya Kalpana';
        } else if (root.node_id === 'SAM-17') {
          group = 'Comprehensive Question Bank';
        }

        const isDirect = root.navigation_type === 'direct_questions';
        const isSthanaDirect = root.navigation_type === 'hierarchical_to_sthana_then_direct_questions';

        return {
          id: root.node_id,
          name_en: root.display_name_en,
          name_hi: root.display_name_hi,
          expected_count: root.expected_count,
          validated_count: valCount,
          coverage_percent: Math.min(100, Math.round((valCount / (root.expected_count || 1)) * 100)),
          status: valCount >= (root.expected_count || 0) ? 'ready' : (valCount > 0 ? 'partial' : 'pending'),
          navigation_type: root.navigation_type,
          is_direct: isDirect,
          is_sthana_direct: isSthanaDirect,
          category_group: group,
          division_count: divs.length,
          divisions: divs
        };
      });

      return sendJSON(res, result);
    } catch (e) {
      console.error('[API /api/samhitas Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 2. GET /api/subjects - All 38 Subjectwise Categories
  if (pathname === '/api/subjects' && req.method === 'GET') {
    try {
      if (!subjectwiseDb) {
        return sendJSON(res, { error: 'Subjectwise DB not connected' }, 500);
      }
      const rows = subjectwiseDb.prepare(`
        SELECT s.local_subject_id as id, s.display_order, s.display_name, s.expected_assignments,
               COUNT(r.local_question_id) as validated_count
        FROM subjects s
        LEFT JOIN ready_subject_questions r ON s.local_subject_id = r.local_subject_id
        GROUP BY s.local_subject_id
        ORDER BY s.display_order ASC
      `).all();

      const subjects = rows.map(r => ({
        id: r.id,
        display_order: r.display_order,
        name_en: r.display_name,
        name_hi: null,
        display_name: r.display_name,
        expected_count: r.expected_assignments,
        validated_count: r.validated_count,
        chapter_count: 0,
        coverage_percent: Math.min(100, Math.round((r.validated_count / (r.expected_assignments || 1)) * 100)),
        is_ready: r.validated_count > 0,
        status: r.validated_count >= r.expected_assignments ? 'ready' : (r.validated_count > 0 ? 'partial' : 'pending'),
        navigation_type: 'direct_questions',
        category_group: 'Subjectwise Question Bank'
      }));

      return sendJSON(res, subjects);
    } catch (e) {
      console.error('[API /api/subjects Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 3. GET /api/subjects/:id - Single Subject details
  if (pathname.startsWith('/api/subjects/') && req.method === 'GET') {
    try {
      const subjectId = pathname.split('/').pop();
      if (!subjectwiseDb) {
        return sendJSON(res, { error: 'Subjectwise DB not connected' }, 500);
      }
      const s = subjectwiseDb.prepare(`
        SELECT s.local_subject_id as id, s.display_order, s.display_name, s.expected_assignments,
               COUNT(r.local_question_id) as validated_count
        FROM subjects s
        LEFT JOIN ready_subject_questions r ON s.local_subject_id = r.local_subject_id
        WHERE s.local_subject_id = ?
        GROUP BY s.local_subject_id
      `).get(subjectId);

      if (!s) {
        return sendJSON(res, { error: 'Subject not found' }, 404);
      }

      return sendJSON(res, {
        id: s.id,
        display_order: s.display_order,
        name_en: s.display_name,
        name_hi: null,
        display_name: s.display_name,
        expected_count: s.expected_assignments,
        validated_count: s.validated_count,
        coverage_percent: Math.min(100, Math.round((s.validated_count / (s.expected_assignments || 1)) * 100)),
        is_ready: s.validated_count > 0,
        status: s.validated_count >= s.expected_assignments ? 'ready' : (s.validated_count > 0 ? 'partial' : 'pending'),
        navigation_type: 'direct_questions',
        breadcrumbs: [
          { id: 'home', name_en: 'Home', type: 'root' },
          { id: 'subjectwise', name_en: 'Subjectwise MCQs', type: 'hub' },
          { id: s.id, name_en: s.display_name, type: 'subject' }
        ],
        children: []
      });
    } catch (e) {
      console.error('[API /api/subjects/:id Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 4. GET /api/nodes/:id - Node details & hierarchical breadcrumbs (Samhitawise & Subjectwise fallback)
  if (pathname.startsWith('/api/nodes/') && req.method === 'GET') {
    try {
      const nodeId = pathname.split('/').pop();

      if (isSubjectwise(nodeId)) {
        if (!subjectwiseDb) return sendJSON(res, { error: 'Subjectwise DB not connected' }, 500);
        const s = subjectwiseDb.prepare(`
          SELECT s.local_subject_id as id, s.display_order, s.display_name, s.expected_assignments,
                 COUNT(r.local_question_id) as validated_count
          FROM subjects s
          LEFT JOIN ready_subject_questions r ON s.local_subject_id = r.local_subject_id
          WHERE s.local_subject_id = ?
          GROUP BY s.local_subject_id
        `).get(nodeId);

        if (!s) return sendJSON(res, { error: 'Subject not found' }, 404);

        return sendJSON(res, {
          id: s.id,
          name_en: s.display_name,
          name_hi: null,
          type: 'subject',
          chapter_number: null,
          expected_count: s.expected_assignments,
          validated_count: s.validated_count,
          coverage_percent: Math.min(100, Math.round((s.validated_count / (s.expected_assignments || 1)) * 100)),
          is_ready: s.validated_count > 0,
          navigation_type: 'direct_questions',
          breadcrumbs: [
            { id: 'home', name_en: 'Home', type: 'root' },
            { id: 'subjectwise', name_en: 'Subjectwise MCQs', type: 'hub' },
            { id: s.id, name_en: s.display_name, type: 'subject' }
          ],
          children: []
        });
      }

      const { counts, allNodes } = getCountCache();
      const node = allNodes.find(n => n.node_id === nodeId);
      if (!node) {
        return sendJSON(res, { error: 'Node not found' }, 404);
      }

      // Build breadcrumbs
      const breadcrumbs = [];
      let curr = node;
      while (curr) {
        breadcrumbs.unshift({
          id: curr.node_id,
          name_en: curr.display_name_en,
          name_hi: curr.display_name_hi,
          type: curr.type
        });
        curr = curr.parent_node_id ? allNodes.find(n => n.node_id === curr.parent_node_id) : null;
      }

      // Children
      const rawChildren = allNodes.filter(n => n.parent_node_id === nodeId);
      rawChildren.sort((a, b) => {
        if (a.chapter_number !== null && b.chapter_number !== null) {
          return a.chapter_number - b.chapter_number;
        }
        return a.node_id.localeCompare(b.node_id);
      });

      const children = rawChildren.map(ch => {
        const valCount = counts.get(ch.node_id) || 0;
        return {
          id: ch.node_id,
          name_en: ch.display_name_en,
          name_hi: ch.display_name_hi,
          type: ch.type,
          chapter_number: ch.chapter_number,
          expected_count: ch.expected_count,
          validated_count: valCount,
          coverage_percent: Math.min(100, Math.round((valCount / (ch.expected_count || 1)) * 100)),
          is_ready: valCount > 0,
          status: valCount >= (ch.expected_count || 0) ? 'ready' : (valCount > 0 ? 'partial' : 'pending')
        };
      });

      const thisValCount = counts.get(node.node_id) || 0;

      return sendJSON(res, {
        id: node.node_id,
        name_en: node.display_name_en,
        name_hi: node.display_name_hi,
        type: node.type,
        chapter_number: node.chapter_number,
        expected_count: node.expected_count,
        validated_count: thisValCount,
        coverage_percent: Math.min(100, Math.round((thisValCount / (node.expected_count || 1)) * 100)),
        is_ready: thisValCount > 0,
        navigation_type: node.navigation_type,
        breadcrumbs,
        children
      });
    } catch (e) {
      console.error('[API /api/nodes Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 5. GET /api/questions - List questions (supports Samhitawise & Subjectwise)
  if (pathname === '/api/questions' && req.method === 'GET') {
    try {
      const nodeId = params.get('node_id') || params.get('subject_id') || params.get('subject');
      const limit = parseInt(params.get('limit') || '50');
      const offset = parseInt(params.get('offset') || '0');
      const search = params.get('search');
      const reviewMode = params.get('review_mode') === 'true';

      if (!nodeId) {
        return sendJSON(res, { error: 'node_id is required' }, 400);
      }

      let questions = [];

      if (isSubjectwise(nodeId)) {
        // Phase 3 Subjectwise DB
        let sql = `
          SELECT local_question_id as question_id, source_question_id, question_text as stem,
                 options_json, correct_answer_json, explanation, media_json
          FROM ready_subject_questions
          WHERE local_subject_id = ?
        `;
        const sqlParams = [nodeId];
        if (search) {
          sql += ` AND question_text LIKE ?`;
          sqlParams.push(`%${search}%`);
        }
        sql += ` ORDER BY source_order ASC LIMIT ? OFFSET ?`;
        sqlParams.push(limit, offset);

        const rows = subjectwiseDb.prepare(sql).all(...sqlParams);
        questions = rows.map(r => {
          let opts = [];
          try { opts = JSON.parse(r.options_json || '[]'); } catch (e) { opts = []; }
          let correctMeta = {};
          try { correctMeta = JSON.parse(r.correct_answer_json || '{}'); } catch (e) { correctMeta = {}; }
          let media = [];
          try { media = JSON.parse(r.media_json || '[]'); } catch (e) { media = []; }

          return {
            question_id: r.question_id,
            source_qid: r.source_question_id,
            stem: r.stem,
            options: opts.map((optText, optIdx) => ({
              option_id: `${r.question_id}_opt_${optIdx}`,
              position: optIdx + 1,
              text: optText,
              is_correct: reviewMode ? (optIdx === correctMeta.correct_index) : undefined
            })),
            explanation: reviewMode ? r.explanation : undefined,
            media
          };
        });
      } else if (isPhase1(nodeId)) {
        // Phase 1 DB
        let sql = `
          SELECT DISTINCT q.question_id, q.stem_raw, q.stem_format, q.source_question_id, q.review_state,
                          q.answer_explanation_raw
          FROM questions q
          JOIN question_locations l USING (question_id)
          WHERE (l.node_id = ? OR l.node_id LIKE ?) AND q.review_state = 'validated'
        `;
        const sqlParams = [nodeId, `${nodeId}-%`];
        if (search) {
          sql += ` AND q.stem_raw LIKE ?`;
          sqlParams.push(`%${search}%`);
        }
        sql += ` ORDER BY q.source_question_id ASC LIMIT ? OFFSET ?`;
        sqlParams.push(limit, offset);

        const rows = phase1Db.prepare(sql).all(...sqlParams);
        questions = rows.map(r => {
          const opts = phase1Db.prepare(`
            SELECT option_id, position, option_raw, is_correct
            FROM options WHERE question_id = ? ORDER BY position ASC
          `).all(r.question_id);

          return {
            question_id: r.question_id,
            source_qid: r.source_question_id,
            stem: r.stem_raw,
            options: opts.map(o => ({
              option_id: o.option_id,
              position: o.position,
              text: o.option_raw,
              is_correct: reviewMode ? (o.is_correct === 1) : undefined
            })),
            explanation: reviewMode ? r.answer_explanation_raw : undefined
          };
        });
      } else {
        // Phase 2 DB
        let sql = `
          SELECT DISTINCT q.question_id, q.stem_raw, q.stem_format, q.source_question_id, q.state,
                          q.explanation_raw
          FROM questions q
          JOIN question_leaf_assignments a ON q.question_id = a.question_id
          WHERE (a.leaf_node_id = ? OR a.leaf_node_id LIKE ?) AND a.verified = 1 AND q.state = 'validated'
        `;
        const sqlParams = [nodeId, `${nodeId}-%`];
        if (search) {
          sql += ` AND q.stem_raw LIKE ?`;
          sqlParams.push(`%${search}%`);
        }
        sql += ` ORDER BY q.source_question_id ASC LIMIT ? OFFSET ?`;
        sqlParams.push(limit, offset);

        const rows = phase2Db.prepare(sql).all(...sqlParams);
        questions = rows.map(r => {
          const opts = phase2Db.prepare(`
            SELECT option_id, position, option_raw, is_correct
            FROM question_options WHERE question_id = ? ORDER BY position ASC
          `).all(r.question_id);

          return {
            question_id: r.question_id,
            source_qid: r.source_question_id,
            stem: r.stem_raw,
            options: opts.map(o => ({
              option_id: o.option_id,
              position: o.position,
              text: o.option_raw,
              is_correct: reviewMode ? (o.is_correct === 1) : undefined
            })),
            explanation: reviewMode ? r.explanation_raw : undefined
          };
        });
      }

      return sendJSON(res, {
        node_id: nodeId,
        count: questions.length,
        questions
      });
    } catch (e) {
      console.error('[API /api/questions Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 6. POST /api/practice/start - Initialize a practice test
  if (pathname === '/api/practice/start' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { mode = 'chapter', scope_node_id, count = 20, shuffle = true, timed = false, duration_mins = 20 } = body;

      if (!scope_node_id) {
        return sendJSON(res, { error: 'scope_node_id is required' }, 400);
      }

      let qRows = [];

      if (isSubjectwise(scope_node_id)) {
        // Phase 3 Subjectwise DB
        qRows = subjectwiseDb.prepare(`
          SELECT local_question_id as question_id, source_question_id, question_text as stem_raw, options_json
          FROM ready_subject_questions
          WHERE local_subject_id = ?
        `).all(scope_node_id);
      } else if (isPhase1(scope_node_id)) {
        if (mode === 'chapter') {
          qRows = phase1Db.prepare(`
            SELECT DISTINCT q.question_id, q.stem_raw, q.source_question_id
            FROM questions q
            JOIN question_locations l USING (question_id)
            WHERE l.node_id = ? AND q.review_state = 'validated'
          `).all(scope_node_id);
        } else if (mode === 'division') {
          qRows = phase1Db.prepare(`
            SELECT DISTINCT q.question_id, q.stem_raw, q.source_question_id
            FROM questions q
            JOIN question_locations l USING (question_id)
            JOIN mapping_nodes ch ON l.node_id = ch.node_id
            WHERE (ch.parent_node_id = ? OR l.node_id = ?) AND q.review_state = 'validated'
          `).all(scope_node_id, scope_node_id);
        } else {
          // samhita
          qRows = phase1Db.prepare(`
            SELECT DISTINCT q.question_id, q.stem_raw, q.source_question_id
            FROM questions q
            JOIN question_locations l USING (question_id)
            WHERE (l.node_id = ? OR l.node_id LIKE ?) AND q.review_state = 'validated'
          `).all(scope_node_id, `${scope_node_id}-%`);
        }
      } else {
        // Phase 2
        if (mode === 'chapter' || mode === 'direct') {
          qRows = phase2Db.prepare(`
            SELECT DISTINCT q.question_id, q.stem_raw, q.source_question_id
            FROM questions q
            JOIN question_leaf_assignments a ON q.question_id = a.question_id
            WHERE a.leaf_node_id = ? AND a.verified = 1 AND q.state = 'validated'
          `).all(scope_node_id);
        } else if (mode === 'division') {
          qRows = phase2Db.prepare(`
            SELECT DISTINCT q.question_id, q.stem_raw, q.source_question_id
            FROM questions q
            JOIN question_leaf_assignments a ON q.question_id = a.question_id
            WHERE (a.leaf_node_id = ? OR a.leaf_node_id LIKE ?) AND a.verified = 1 AND q.state = 'validated'
          `).all(scope_node_id, `${scope_node_id}-%`);
        } else {
          // samhita root
          qRows = phase2Db.prepare(`
            SELECT DISTINCT q.question_id, q.stem_raw, q.source_question_id
            FROM questions q
            JOIN question_leaf_assignments a ON q.question_id = a.question_id
            WHERE (a.leaf_node_id = ? OR a.leaf_node_id LIKE ?) AND a.verified = 1 AND q.state = 'validated'
          `).all(scope_node_id, `${scope_node_id}-%`);
        }
      }

      if (qRows.length === 0) {
        return sendJSON(res, {
          error: 'No validated questions available for this category yet.'
        }, 400);
      }

      if (shuffle) {
        qRows.sort(() => Math.random() - 0.5);
      }

      const selected = qRows.slice(0, Math.min(count, qRows.length));
      const qIds = selected.map(q => q.question_id);

      const sessionId = 'sess_' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();

      sessionsDb.prepare(`
        INSERT INTO practice_sessions (
          session_id, created_at, mode, scope_node_id, question_ids_json, total_questions, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'active')
      `).run(sessionId, now, mode, scope_node_id, JSON.stringify(qIds), selected.length);

      const questionsForClient = selected.map(q => {
        let opts = [];
        if (isSubjectwise(scope_node_id)) {
          let rawOpts = [];
          try { rawOpts = JSON.parse(q.options_json || '[]'); } catch (e) { rawOpts = []; }
          opts = rawOpts.map((text, idx) => ({
            option_id: `${q.question_id}_opt_${idx}`,
            position: idx + 1,
            text
          }));
        } else if (isPhase1(scope_node_id)) {
          const rawOpts = phase1Db.prepare(`
            SELECT option_id, position, option_raw
            FROM options WHERE question_id = ? ORDER BY position ASC
          `).all(q.question_id);
          opts = rawOpts.map(o => ({
            option_id: o.option_id,
            position: o.position,
            text: o.option_raw
          }));
        } else {
          const rawOpts = phase2Db.prepare(`
            SELECT option_id, position, option_raw
            FROM question_options WHERE question_id = ? ORDER BY position ASC
          `).all(q.question_id);
          opts = rawOpts.map(o => ({
            option_id: o.option_id,
            position: o.position,
            text: o.option_raw
          }));
        }

        return {
          question_id: q.question_id,
          source_qid: q.source_question_id,
          stem: q.stem_raw,
          options: opts
        };
      });

      return sendJSON(res, {
        session_id: sessionId,
        mode,
        scope_node_id,
        total_questions: selected.length,
        timed,
        duration_seconds: timed ? (duration_mins * 60) : null,
        questions: questionsForClient
      });
    } catch (e) {
      console.error('[API /api/practice/start Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 7. GET /api/practice/:id - Get session info for resume / direct recovery
  if (pathname.startsWith('/api/practice/') && !pathname.endsWith('/answer') && !pathname.endsWith('/submit') && req.method === 'GET') {
    try {
      const parts = pathname.split('/');
      const sessionId = parts[3];

      const session = sessionsDb.prepare(`SELECT * FROM practice_sessions WHERE session_id = ?`).get(sessionId);
      if (!session) {
        return sendJSON(res, { error: 'Session not found' }, 404);
      }

      const isSub = isSubjectwise(session.scope_node_id);
      const p1 = isPhase1(session.scope_node_id);

      const qIds = JSON.parse(session.question_ids_json);
      const questionsForClient = qIds.map(qid => {
        let q = null;
        let opts = [];

        if (isSub) {
          const row = subjectwiseDb.prepare(`
            SELECT local_question_id as question_id, source_question_id, question_text as stem_raw, options_json
            FROM ready_subject_questions WHERE local_question_id = ?
          `).get(qid);
          if (row) {
            let rawOpts = [];
            try { rawOpts = JSON.parse(row.options_json || '[]'); } catch (e) { rawOpts = []; }
            q = row;
            opts = rawOpts.map((text, idx) => ({
              option_id: `${row.question_id}_opt_${idx}`,
              position: idx + 1,
              text
            }));
          }
        } else if (p1) {
          q = phase1Db.prepare(`SELECT question_id, source_question_id, stem_raw FROM questions WHERE question_id = ?`).get(qid);
          if (q) {
            const rawOpts = phase1Db.prepare(`SELECT option_id, position, option_raw FROM options WHERE question_id = ? ORDER BY position ASC`).all(qid);
            opts = rawOpts.map(o => ({
              option_id: o.option_id,
              position: o.position,
              text: o.option_raw
            }));
          }
        } else {
          q = phase2Db.prepare(`SELECT question_id, source_question_id, stem_raw FROM questions WHERE question_id = ?`).get(qid);
          if (q) {
            const rawOpts = phase2Db.prepare(`SELECT option_id, position, option_raw FROM question_options WHERE question_id = ? ORDER BY position ASC`).all(qid);
            opts = rawOpts.map(o => ({
              option_id: o.option_id,
              position: o.position,
              text: o.option_raw
            }));
          }
        }

        if (!q) return null;
        return {
          question_id: q.question_id,
          source_qid: q.source_question_id,
          stem: q.stem_raw,
          options: opts
        };
      }).filter(Boolean);

      const savedAnswers = sessionsDb.prepare(`SELECT * FROM practice_answers WHERE session_id = ?`).all(sessionId);
      const answersMap = {};
      const bookmarksMap = {};
      for (const a of savedAnswers) {
        answersMap[a.question_id] = JSON.parse(a.selected_option_ids_json);
        if (a.is_bookmarked) bookmarksMap[a.question_id] = true;
      }

      return sendJSON(res, {
        session_id: session.session_id,
        mode: session.mode,
        scope_node_id: session.scope_node_id,
        total_questions: session.total_questions,
        timed: session.total_questions > 0,
        duration_seconds: null,
        questions: questionsForClient,
        saved_answers: answersMap,
        saved_bookmarks: bookmarksMap
      });
    } catch (e) {
      console.error('[API /api/practice/:id Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 8. POST /api/practice/:id/answer - Save an answer during test
  if (pathname.startsWith('/api/practice/') && pathname.endsWith('/answer') && req.method === 'POST') {
    try {
      const parts = pathname.split('/');
      const sessionId = parts[3];
      const body = await parseBody(req);
      const { question_id, selected_option_ids = [], time_ms = 0, is_bookmarked = 0 } = body;

      if (!question_id) {
        return sendJSON(res, { error: 'question_id is required' }, 400);
      }

      const session = sessionsDb.prepare(`SELECT scope_node_id FROM practice_sessions WHERE session_id = ?`).get(sessionId);
      const isSub = session ? isSubjectwise(session.scope_node_id) : isSubjectwise(question_id);
      const p1 = session ? isPhase1(session.scope_node_id) : isPhase1(question_id);

      let isCorrect = null;
      if (selected_option_ids.length > 0) {
        if (isSub) {
          const row = subjectwiseDb.prepare(`SELECT correct_answer_json FROM ready_subject_questions WHERE local_question_id = ?`).get(question_id);
          if (row) {
            let meta = {};
            try { meta = JSON.parse(row.correct_answer_json || '{}'); } catch (e) { meta = {}; }
            const correctOptId = `${question_id}_opt_${meta.correct_index}`;
            isCorrect = selected_option_ids.includes(correctOptId) ? 1 : 0;
          }
        } else if (p1) {
          const correctOpt = phase1Db.prepare(`SELECT option_id FROM options WHERE question_id = ? AND is_correct = 1`).get(question_id);
          isCorrect = (correctOpt && selected_option_ids.includes(correctOpt.option_id)) ? 1 : 0;
        } else {
          const correctOpt = phase2Db.prepare(`SELECT option_id FROM question_options WHERE question_id = ? AND is_correct = 1`).get(question_id);
          isCorrect = (correctOpt && selected_option_ids.includes(correctOpt.option_id)) ? 1 : 0;
        }
      }

      const now = new Date().toISOString();
      sessionsDb.prepare(`
        INSERT INTO practice_answers (
          session_id, question_id, selected_option_ids_json, is_correct, answered_at, time_ms, is_bookmarked
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, question_id) DO UPDATE SET
          selected_option_ids_json = excluded.selected_option_ids_json,
          is_correct = excluded.is_correct,
          answered_at = excluded.answered_at,
          time_ms = excluded.time_ms,
          is_bookmarked = excluded.is_bookmarked
      `).run(sessionId, question_id, JSON.stringify(selected_option_ids), isCorrect, now, time_ms, is_bookmarked ? 1 : 0);

      return sendJSON(res, { success: true, session_id: sessionId, question_id });
    } catch (e) {
      console.error('[API /api/practice/:id/answer Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 9. POST /api/practice/:id/submit - Finalize and evaluate session
  if (pathname.startsWith('/api/practice/') && pathname.endsWith('/submit') && req.method === 'POST') {
    try {
      const parts = pathname.split('/');
      const sessionId = parts[3];

      const session = sessionsDb.prepare(`SELECT * FROM practice_sessions WHERE session_id = ?`).get(sessionId);
      if (!session) {
        return sendJSON(res, { error: 'Session not found' }, 404);
      }

      const isSub = isSubjectwise(session.scope_node_id);
      const p1 = isPhase1(session.scope_node_id);

      const qIds = JSON.parse(session.question_ids_json);
      const answers = sessionsDb.prepare(`SELECT * FROM practice_answers WHERE session_id = ?`).all(sessionId);
      const ansMap = {};
      answers.forEach(a => {
        ansMap[a.question_id] = a;
      });

      let correct = 0;
      let incorrect = 0;
      let unattempted = 0;
      let totalTimeMs = 0;

      const review = qIds.map(qid => {
        let q = null;
        let opts = [];

        if (isSub) {
          const row = subjectwiseDb.prepare(`
            SELECT local_question_id, question_text, options_json, correct_answer_json, explanation
            FROM ready_subject_questions WHERE local_question_id = ?
          `).get(qid);
          if (row) {
            let meta = {};
            try { meta = JSON.parse(row.correct_answer_json || '{}'); } catch (e) { meta = {}; }
            let rawOpts = [];
            try { rawOpts = JSON.parse(row.options_json || '[]'); } catch (e) { rawOpts = []; }
            q = {
              stem_raw: row.question_text,
              explanation_raw: row.explanation
            };
            opts = rawOpts.map((text, idx) => ({
              option_id: `${row.local_question_id}_opt_${idx}`,
              position: idx + 1,
              option_raw: text,
              is_correct: idx === meta.correct_index
            }));
          }
        } else if (p1) {
          q = phase1Db.prepare(`SELECT * FROM questions WHERE question_id = ?`).get(qid);
          const rawOpts = phase1Db.prepare(`SELECT * FROM options WHERE question_id = ? ORDER BY position ASC`).all(qid);
          opts = rawOpts.map(o => ({
            option_id: o.option_id,
            position: o.position,
            option_raw: o.option_raw,
            is_correct: o.is_correct === 1
          }));
        } else {
          q = phase2Db.prepare(`SELECT * FROM questions WHERE question_id = ?`).get(qid);
          const rawOpts = phase2Db.prepare(`SELECT * FROM question_options WHERE question_id = ? ORDER BY position ASC`).all(qid);
          opts = rawOpts.map(o => ({
            option_id: o.option_id,
            position: o.position,
            option_raw: o.option_raw,
            is_correct: o.is_correct === 1
          }));
        }

        const a = ansMap[qid];
        let selectedOpts = [];
        let isRight = false;
        let isUnatt = true;

        if (a) {
          selectedOpts = JSON.parse(a.selected_option_ids_json || '[]');
          totalTimeMs += (a.time_ms || 0);
          if (selectedOpts.length > 0) {
            isUnatt = false;
            isRight = a.is_correct === 1;
            if (isRight) correct++;
            else incorrect++;
          } else {
            unattempted++;
          }
        } else {
          unattempted++;
        }

        return {
          question_id: qid,
          source_qid: q ? (q.source_question_id || q.local_question_id) : '',
          stem: q ? q.stem_raw : '',
          explanation: q ? (q.answer_explanation_raw || q.explanation_raw || '') : '',
          selected_options: selectedOpts,
          is_correct: isRight,
          is_unattempted: isUnatt,
          options: opts.map(o => ({
            option_id: o.option_id,
            position: o.position,
            text: o.option_raw,
            is_correct: o.is_correct
          }))
        };
      });

      const totalScore = (correct * 4) - (incorrect * 1);
      const maxScore = qIds.length * 4;
      const accuracy = qIds.length > 0 ? Math.round((correct / qIds.length) * 100) : 0;
      const now = new Date().toISOString();

      sessionsDb.prepare(`UPDATE practice_sessions SET status = 'completed', finished_at = ? WHERE session_id = ?`).run(now, sessionId);

      return sendJSON(res, {
        session_id: sessionId,
        mode: session.mode,
        total_questions: qIds.length,
        correct_count: correct,
        incorrect_count: incorrect,
        unattempted_count: unattempted,
        total_score: totalScore,
        max_score: maxScore,
        accuracy_percent: accuracy,
        total_time_seconds: Math.round(totalTimeMs / 1000),
        review
      });
    } catch (e) {
      console.error('[API /api/practice/:id/submit Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 10. GET /api/coverage - Live reconciliation audit (Samhitawise + Subjectwise)
  if (pathname === '/api/coverage' && req.method === 'GET') {
    try {
      const { counts, allNodes } = getCountCache();

      const table = allNodes.map(n => {
        const valCount = counts.get(n.node_id) || 0;
        const discrepancy = n.expected_count !== null ? (valCount - n.expected_count) : null;
        let status = 'MATCH';
        if (discrepancy !== null) {
          if (discrepancy < 0) {
            status = valCount === 0 ? 'PENDING' : 'PARTIAL';
          } else if (discrepancy > 0) {
            status = 'OVERFLOW';
          }
        } else {
          status = valCount > 0 ? 'RESOLVED_VERIFIED' : 'PENDING';
        }

        return {
          node_id: n.node_id,
          parent_node_id: n.parent_node_id,
          type: n.type,
          name_en: n.display_name_en,
          name_hi: n.display_name_hi,
          chapter_number: n.chapter_number,
          expected_count: n.expected_count,
          validated_count: valCount,
          discrepancy,
          status
        };
      });

      const roots = allNodes.filter(n => !n.parent_node_id);
      const totalExpected = roots.reduce((acc, s) => acc + (s.expected_count || 0), 0);
      const totalValidated = roots.reduce((acc, s) => acc + (counts.get(s.node_id) || 0), 0);

      // Subjectwise totals
      let subjectwiseTotal = 0;
      let subjectwiseExpected = 57375;
      if (subjectwiseDb) {
        const subRow = subjectwiseDb.prepare(`SELECT COUNT(*) as n FROM ready_subject_questions`).get();
        if (subRow) subjectwiseTotal = subRow.n;
      }

      return sendJSON(res, {
        total_nodes: allNodes.length,
        total_expected_questions: totalExpected,
        total_validated_questions: totalValidated,
        coverage_percent: Math.min(100, Math.round((totalValidated / (totalExpected || 1)) * 100)),
        subjectwise_total: subjectwiseTotal,
        subjectwise_expected: subjectwiseExpected,
        nodes: table
      });
    } catch (e) {
      console.error('[API /api/coverage Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 11. GET /api/bookmarks
  if (pathname === '/api/bookmarks' && req.method === 'GET') {
    try {
      const bookmarked = sessionsDb.prepare(`
        SELECT DISTINCT a.question_id, s.scope_node_id
        FROM practice_answers a
        JOIN practice_sessions s ON a.session_id = s.session_id
        WHERE a.is_bookmarked = 1
        ORDER BY a.answered_at DESC
      `).all();

      const results = bookmarked.map(b => {
        const isSub = isSubjectwise(b.scope_node_id);
        const p1 = isPhase1(b.scope_node_id);
        let q = null;
        if (isSub) {
          q = subjectwiseDb.prepare(`
            SELECT local_question_id as question_id, source_question_id, question_text as stem_raw, explanation
            FROM ready_subject_questions WHERE local_question_id = ?
          `).get(b.question_id);
        } else if (p1) {
          q = phase1Db.prepare(`SELECT question_id, source_question_id, stem_raw, answer_explanation_raw as explanation FROM questions WHERE question_id = ?`).get(b.question_id);
        } else {
          q = phase2Db.prepare(`SELECT question_id, source_question_id, stem_raw, explanation_raw as explanation FROM questions WHERE question_id = ?`).get(b.question_id);
        }
        return q ? { ...q, scope_node_id: b.scope_node_id } : null;
      }).filter(Boolean);

      return sendJSON(res, results);
    } catch (e) {
      console.error('[API /api/bookmarks Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // 12. GET /api/history
  if (pathname === '/api/history' && req.method === 'GET') {
    try {
      const { allNodes } = getCountCache();
      const sessions = sessionsDb.prepare(`
        SELECT session_id, created_at, finished_at, mode, total_questions, status, scope_node_id
        FROM practice_sessions
        WHERE status = 'completed'
        ORDER BY created_at DESC
        LIMIT 25
      `).all();

      const enriched = sessions.map(s => {
        let name_en = s.scope_node_id;
        let name_hi = null;
        if (isSubjectwise(s.scope_node_id)) {
          const sub = subjectwiseDb.prepare(`SELECT display_name FROM subjects WHERE local_subject_id = ?`).get(s.scope_node_id);
          if (sub) name_en = sub.display_name;
        } else {
          const node = allNodes.find(n => n.node_id === s.scope_node_id);
          if (node) {
            name_en = node.display_name_en;
            name_hi = node.display_name_hi;
          }
        }
        return {
          ...s,
          scope_name: name_en,
          scope_name_hi: name_hi
        };
      });

      return sendJSON(res, enriched);
    } catch (e) {
      console.error('[API /api/history Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }


  // -------------------------------------------------------------------
  // PHASE 4: TEST SERIES ROUTES (/api/test-series/*)
  // -------------------------------------------------------------------

  // GET /api/test-series/sessions
  if (pathname === '/api/test-series/sessions' && req.method === 'GET') {
    try {
      const rows = testseriesDb.prepare(`
        SELECT s.session,
               COUNT(DISTINCT s.local_series_id) as series_count,
               COUNT(DISTINCT t.local_test_id) as total_tests,
               COUNT(DISTINCT CASE WHEN t.availability_status = 'available' THEN t.local_test_id END) as available_tests,
               COUNT(DISTINCT CASE WHEN t.availability_status = 'scheduled' THEN t.local_test_id END) as scheduled_tests,
               COUNT(q.local_question_id) as total_questions
        FROM test_series s
        LEFT JOIN series_tests t ON s.local_series_id = t.local_series_id
        LEFT JOIN test_questions q ON t.local_test_id = q.local_test_id
        GROUP BY s.session
        ORDER BY s.session DESC
      `).all();
      return sendJSON(res, rows);
    } catch (e) {
      console.error('[API /api/test-series/sessions Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // GET /api/test-series - List all series, optional ?session=2026-2027
  if (pathname === '/api/test-series' && req.method === 'GET') {
    try {
      const sessionFilter = params.get('session');
      let query = `
        SELECT s.local_series_id, s.session, s.title_source_exact, s.expected_test_count,
               s.start_date_iso, s.end_date_iso, s.students_enrolled_source,
               s.access_badge_source, s.exam_button_label_source, s.action_button_label_source,
               COUNT(DISTINCT t.local_test_id) as verified_test_count,
               COUNT(DISTINCT CASE WHEN t.availability_status = 'available' THEN t.local_test_id END) as available_test_count,
               COUNT(DISTINCT CASE WHEN t.availability_status = 'scheduled' THEN t.local_test_id END) as scheduled_test_count,
               COUNT(q.local_question_id) as questions_count
        FROM test_series s
        LEFT JOIN series_tests t ON s.local_series_id = t.local_series_id
        LEFT JOIN test_questions q ON t.local_test_id = q.local_test_id
      `;
      const queryParams = [];
      if (sessionFilter) {
        query += ` WHERE s.session = ? `;
        queryParams.push(sessionFilter);
      }
      query += ` GROUP BY s.local_series_id ORDER BY s.session DESC, s.local_series_id ASC `;
      
      const rows = testseriesDb.prepare(query).all(...queryParams);
      return sendJSON(res, rows);
    } catch (e) {
      console.error('[API /api/test-series Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // GET /api/test-series/audit
  if (pathname === '/api/test-series/audit' && req.method === 'GET') {
    try {
      const rows = testseriesDb.prepare(`
        SELECT s.local_series_id, s.session, s.title_source_exact, s.expected_test_count,
               COUNT(DISTINCT t.local_test_id) as discovered,
               COUNT(DISTINCT CASE WHEN t.validation_status='verified' THEN t.local_test_id END) as verified,
               COUNT(DISTINCT CASE WHEN t.validation_status='quarantined' THEN t.local_test_id END) as quarantined,
               COUNT(DISTINCT CASE WHEN t.availability_status='available' THEN t.local_test_id END) as available,
               COUNT(DISTINCT CASE WHEN t.availability_status='scheduled' THEN t.local_test_id END) as scheduled,
               COUNT(q.local_question_id) as question_count
        FROM test_series s
        LEFT JOIN series_tests t ON s.local_series_id = t.local_series_id
        LEFT JOIN test_questions q ON t.local_test_id = q.local_test_id
        GROUP BY s.local_series_id
        ORDER BY s.session DESC, s.local_series_id ASC
      `).all();

      const totalExpected = rows.reduce((acc, r) => acc + r.expected_test_count, 0);
      const totalVerified = rows.reduce((acc, r) => acc + (r.verified || 0), 0);
      const totalQuestions = rows.reduce((acc, r) => acc + (r.question_count || 0), 0);

      return sendJSON(res, {
        series: rows,
        expected_test_assignments: totalExpected,
        verified_test_assignments: totalVerified,
        verified_question_records: totalQuestions,
        all_test_counts_match: totalExpected === 362 && totalVerified === 362
      });
    } catch (e) {
      console.error('[API /api/test-series/audit Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // GET /api/test-series/:seriesId (e.g. /api/test-series/TS-2026-27-01)
  const seriesMatch = pathname.match(/^\/api\/test-series\/([A-Za-z0-9_-]+)$/);
  if (seriesMatch && req.method === 'GET') {
    const seriesId = seriesMatch[1];
    try {
      const series = testseriesDb.prepare(`
        SELECT s.*, 
               COUNT(DISTINCT t.local_test_id) as verified_test_count,
               SUM(CASE WHEN t.availability_status = 'available' THEN 1 ELSE 0 END) as available_test_count,
               SUM(CASE WHEN t.availability_status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_test_count
        FROM test_series s
        LEFT JOIN series_tests t ON s.local_series_id = t.local_series_id
        WHERE s.local_series_id = ?
        GROUP BY s.local_series_id
      `).get(seriesId);

      if (!series) {
        return sendJSON(res, { error: 'Test series not found' }, 404);
      }

      const tests = testseriesDb.prepare(`
        SELECT t.local_test_id, t.source_test_id, t.title_source_exact, t.source_order,
               t.scheduled_at_source, t.duration_minutes, t.source_question_count,
               t.marks_per_correct, t.marks_per_incorrect, t.availability_status,
               t.validation_status,
               COUNT(q.local_question_id) as questions_count
        FROM series_tests t
        LEFT JOIN test_questions q ON t.local_test_id = q.local_test_id
        WHERE t.local_series_id = ?
        GROUP BY t.local_test_id
        ORDER BY t.source_order ASC
      `).all(seriesId);

      return sendJSON(res, {
        series,
        tests
      });
    } catch (e) {
      console.error('[API /api/test-series/:id Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // GET /api/test-series/tests/:testId (e.g. /api/test-series/tests/TS-2026-27-01-T01)
  const testDetailMatch = pathname.match(/^\/api\/test-series\/tests\/([A-Za-z0-9_-]+)$/);
  if (testDetailMatch && req.method === 'GET') {
    const testId = testDetailMatch[1];
    try {
      const test = testseriesDb.prepare(`
        SELECT t.*,
               COUNT(q.local_question_id) as questions_count
        FROM series_tests t
        LEFT JOIN test_questions q ON t.local_test_id = q.local_test_id
        WHERE t.local_test_id = ?
        GROUP BY t.local_test_id
      `).get(testId);

      if (!test) {
        return sendJSON(res, { error: 'Test not found' }, 404);
      }

      const series = testseriesDb.prepare(`
        SELECT * FROM test_series WHERE local_series_id = ?
      `).get(test.local_series_id);

      return sendJSON(res, { test, series });
    } catch (e) {
      console.error('[API /api/test-series/tests/:id Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // GET /api/test-series/tests/:testId/questions - Test questions for examination (Answers masked)
  const testQuestionsMatch = pathname.match(/^\/api\/test-series\/tests\/([A-Za-z0-9_-]+)\/questions$/);
  if (testQuestionsMatch && req.method === 'GET') {
    const testId = testQuestionsMatch[1];
    try {
      const test = testseriesDb.prepare(`SELECT * FROM series_tests WHERE local_test_id = ?`).get(testId);
      if (!test) {
        return sendJSON(res, { error: 'Test not found' }, 404);
      }

      if (test.availability_status !== 'available') {
        return sendJSON(res, { error: 'This test is scheduled for future release and questions are not yet available', scheduled_at: test.scheduled_at_source }, 403);
      }

      const questions = testseriesDb.prepare(`
        SELECT local_question_id, source_question_id, question_position,
               question_text_source_exact, original_language
        FROM test_questions
        WHERE local_test_id = ?
        ORDER BY question_position ASC
      `).all(testId);

      if (!questions.length) {
        return sendJSON(res, { error: 'No questions found for this test' }, 404);
      }

      const optionsStmt = testseriesDb.prepare(`
        SELECT position, option_text_source_exact
        FROM test_options
        WHERE local_question_id = ?
        ORDER BY position ASC
      `);

      const questionsWithOptions = questions.map(q => ({
        local_question_id: q.local_question_id,
        question_position: q.question_position,
        question_text: q.question_text_source_exact,
        original_language: q.original_language,
        options: optionsStmt.all(q.local_question_id).map(o => ({
          position: o.position,
          option_text: o.option_text_source_exact
        }))
      }));

      return sendJSON(res, {
        test: {
          local_test_id: test.local_test_id,
          title_source_exact: test.title_source_exact,
          duration_minutes: test.duration_minutes || 120,
          marks_per_correct: test.marks_per_correct || 4.0,
          marks_per_incorrect: test.marks_per_incorrect || 1.0,
          total_questions: questionsWithOptions.length
        },
        questions: questionsWithOptions
      });
    } catch (e) {
      console.error('[API /api/test-series/tests/:id/questions Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // POST /api/test-series/attempts - Start exam attempt
  if (pathname === '/api/test-series/attempts' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { test_id } = body;
      if (!test_id) {
        return sendJSON(res, { error: 'test_id is required' }, 400);
      }

      const test = testseriesDb.prepare(`SELECT * FROM series_tests WHERE local_test_id = ?`).get(test_id);
      if (!test) {
        return sendJSON(res, { error: 'Test not found' }, 404);
      }

      const attempt_id = 'TS-ATT-' + crypto.randomUUID();
      const started_at = new Date().toISOString();
      const qCount = testseriesDb.prepare(`SELECT COUNT(*) as cnt FROM test_questions WHERE local_test_id = ?`).get(test_id).cnt;

      sessionsDb.prepare(`
        INSERT INTO testseries_attempts
        (attempt_id, test_id, series_id, started_at, total_questions, total_marks)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(attempt_id, test_id, test.local_series_id, started_at, qCount, qCount * (test.marks_per_correct || 4.0));

      return sendJSON(res, {
        attempt_id,
        test_id,
        series_id: test.local_series_id,
        started_at,
        duration_minutes: test.duration_minutes || 120,
        total_questions: qCount
      });
    } catch (e) {
      console.error('[API POST /api/test-series/attempts Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // POST /api/test-series/attempts/:attemptId/save - Save answers in progress
  const saveAttemptMatch = pathname.match(/^\/api\/test-series\/attempts\/([A-Za-z0-9_-]+)\/save$/);
  if (saveAttemptMatch && req.method === 'POST') {
    const attemptId = saveAttemptMatch[1];
    try {
      const body = await parseBody(req);
      const { answers = {}, marked_for_review = [], time_spent_seconds = 0 } = body;

      sessionsDb.prepare(`
        UPDATE testseries_attempts
        SET answers_json = ?, marked_for_review_json = ?, time_spent_seconds = ?
        WHERE attempt_id = ?
      `).run(JSON.stringify(answers), JSON.stringify(marked_for_review), time_spent_seconds, attemptId);

      return sendJSON(res, { success: true });
    } catch (e) {
      console.error('[API POST /api/test-series/attempts/:id/save Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // POST /api/test-series/attempts/:attemptId/submit - Submit exam and calculate authentic score
  const submitAttemptMatch = pathname.match(/^\/api\/test-series\/attempts\/([A-Za-z0-9_-]+)\/submit$/);
  if (submitAttemptMatch && req.method === 'POST') {
    const attemptId = submitAttemptMatch[1];
    try {
      const body = await parseBody(req);
      const { answers = {}, time_spent_seconds = 0 } = body;

      const attempt = sessionsDb.prepare(`SELECT * FROM testseries_attempts WHERE attempt_id = ?`).get(attemptId);
      if (!attempt) {
        return sendJSON(res, { error: 'Attempt not found' }, 404);
      }

      const test = testseriesDb.prepare(`SELECT * FROM series_tests WHERE local_test_id = ?`).get(attempt.test_id);
      const pm = test.marks_per_correct || 4.0;
      const nm = test.marks_per_incorrect || 1.0;

      const questions = testseriesDb.prepare(`
        SELECT q.local_question_id, q.question_position,
               opt.position as correct_position
        FROM test_questions q
        JOIN test_options opt ON q.local_question_id = opt.local_question_id
        WHERE q.local_test_id = ? AND opt.is_correct_source = 1
      `).all(attempt.test_id);

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;

      for (const q of questions) {
        const userChoice = answers[q.local_question_id];
        if (userChoice === undefined || userChoice === null || userChoice === '') {
          unattemptedCount++;
        } else if (Number(userChoice) === Number(q.correct_position)) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }

      const totalScore = (correctCount * pm) - (incorrectCount * nm);
      const totalMarks = questions.length * pm;
      const accuracy = (correctCount + incorrectCount > 0)
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
        : 0;

      const submittedAt = new Date().toISOString();

      sessionsDb.prepare(`
        UPDATE testseries_attempts
        SET submitted_at = ?, time_spent_seconds = ?, status = 'completed',
            answers_json = ?, correct_count = ?, incorrect_count = ?,
            unattempted_count = ?, score = ?, accuracy = ?
        WHERE attempt_id = ?
      `).run(
        submittedAt, time_spent_seconds, JSON.stringify(answers),
        correctCount, incorrectCount, unattemptedCount, totalScore, accuracy,
        attemptId
      );

      return sendJSON(res, {
        attempt_id: attemptId,
        test_id: attempt.test_id,
        status: 'completed',
        submitted_at: submittedAt,
        time_spent_seconds,
        total_questions: questions.length,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        score: totalScore,
        total_marks: totalMarks,
        accuracy_percent: accuracy
      });
    } catch (e) {
      console.error('[API POST /api/test-series/attempts/:id/submit Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

  // GET /api/test-series/attempts/:attemptId/result - Full exam review with authentic citations & answer keys
  const resultAttemptMatch = pathname.match(/^\/api\/test-series\/attempts\/([A-Za-z0-9_-]+)\/result$/);
  if (resultAttemptMatch && req.method === 'GET') {
    const attemptId = resultAttemptMatch[1];
    try {
      const attempt = sessionsDb.prepare(`SELECT * FROM testseries_attempts WHERE attempt_id = ?`).get(attemptId);
      if (!attempt) {
        return sendJSON(res, { error: 'Attempt not found' }, 404);
      }

      const test = testseriesDb.prepare(`SELECT * FROM series_tests WHERE local_test_id = ?`).get(attempt.test_id);
      const series = testseriesDb.prepare(`SELECT * FROM test_series WHERE local_series_id = ?`).get(test.local_series_id);

      const userAnswers = JSON.parse(attempt.answers_json || '{}');

      const questions = testseriesDb.prepare(`
        SELECT local_question_id, question_position, question_text_source_exact,
               explanation_source, answer_source_json, original_language
        FROM test_questions
        WHERE local_test_id = ?
        ORDER BY question_position ASC
      `).all(attempt.test_id);

      const optionsStmt = testseriesDb.prepare(`
        SELECT position, option_text_source_exact, is_correct_source
        FROM test_options
        WHERE local_question_id = ?
        ORDER BY position ASC
      `);

      const reviewQuestions = questions.map(q => {
        const opts = optionsStmt.all(q.local_question_id);
        const correctOpt = opts.find(o => o.is_correct_source === 1);
        const userChoice = userAnswers[q.local_question_id] !== undefined ? Number(userAnswers[q.local_question_id]) : null;
        const isCorrect = userChoice !== null && correctOpt && userChoice === correctOpt.position;
        const isAttempted = userChoice !== null;

        let ansMeta = {};
        try { ansMeta = JSON.parse(q.answer_source_json || '{}'); } catch(e) {}

        return {
          local_question_id: q.local_question_id,
          question_position: q.question_position,
          question_text: q.question_text_source_exact,
          user_answer: userChoice,
          correct_answer: correctOpt ? correctOpt.position : null,
          is_correct: isCorrect,
          is_attempted: isAttempted,
          explanation: q.explanation_source || ansMeta.commentary || '',
          reference: {
            samhita: ansMeta.reference_samhita || '',
            sthana: ansMeta.reference_sthana || '',
            subject: ansMeta.reference_subject || ''
          },
          options: opts.map(o => ({
            position: o.position,
            option_text: o.option_text_source_exact,
            is_correct: o.is_correct_source === 1
          }))
        };
      });

      return sendJSON(res, {
        scorecard: {
          attempt_id: attempt.attempt_id,
          test_id: attempt.test_id,
          test_title: test.title_source_exact,
          series_title: series.title_source_exact,
          session: series.session,
          status: attempt.status,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          time_spent_seconds: attempt.time_spent_seconds,
          total_questions: attempt.total_questions,
          correct_count: attempt.correct_count,
          incorrect_count: attempt.incorrect_count,
          unattempted_count: attempt.unattempted_count,
          score: attempt.score,
          total_marks: attempt.total_marks,
          accuracy_percent: attempt.accuracy
        },
        questions: reviewQuestions
      });
    } catch (e) {
      console.error('[API /api/test-series/attempts/:id/result Error]', e);
      return sendJSON(res, { error: e.message }, 500);
    }
  }

// Phase 5: Tagwise Routes
  if (await handleTagwiseRoutes(req, res, pathname, req.method, params, tagwiseDb, sessionsDb, sendJSON, parseBody)) {
    return;
  }

  // Phase 6: Previous Year Papers Routes
  if (await handlePreviousYearsRoutes(req, res, pathname, req.method, params, pypDb, sessionsDb, sendJSON, parseBody)) {
    return;
  }

  // Phase 7: Daily Tests Routes
  if (await handleDailyTestsRoutes(req, res, pathname, req.method, params, dailyDb, sessionsDb, sendJSON, parseBody)) {
    return;
  }

  return sendJSON(res, { error: 'Route not found' }, 404);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[API Server] Running on http://127.0.0.1:${PORT}`);
});
