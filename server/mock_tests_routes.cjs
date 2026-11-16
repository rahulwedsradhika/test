/**
 * AyurvedSiddhi Phase 8 — Mock Tests Routes Handler
 * Handles:
 *  - GET  /api/mock-tests/years
 *  - GET  /api/mock-tests/years/:yearId/tests
 *  - GET  /api/mock-tests/tests/:testId
 *  - GET  /api/mock-tests/tests/:testId/questions
 *  - POST /api/mock-tests/attempts/start
 *  - POST /api/mock-tests/attempts/:attemptId/save
 *  - POST /api/mock-tests/attempts/:attemptId/submit
 *  - GET  /api/mock-tests/attempts/:attemptId/results
 *  - GET  /api/mock-tests/audit
 */

const crypto = require('crypto');

async function handleMockTestsRoutes(req, res, pathname, method, params, mockDb, sessionsDb, sendJSON, parseBody) {
  const getParam = (k, fb = '') => (params && typeof params.get === 'function' ? params.get(k) : (params ? params[k] : null)) || fb;

  // 1. GET /api/mock-tests/years - List all 4 years with counts & readiness
  if (method === 'GET' && pathname === '/api/mock-tests/years') {
    try {
      if (!mockDb) {
        return sendJSON(res, { error: 'Mock Tests database unavailable' }, 503);
      }
      const years = mockDb.prepare(`
        SELECT y.year_id, y.display_year, y.academic_session,
               y.source_route_hint, y.expected_listings, y.display_order,
               y.count_provenance,
               COUNT(m.test_id) AS verified_listings,
               SUM(CASE WHEN t.validation_status='verified' AND t.availability='available' THEN 1 ELSE 0 END) AS ready_tests,
               SUM(CASE WHEN t.availability IN ('restricted','unavailable') THEN 1 ELSE 0 END) AS restricted_tests,
               y.expected_listings - COUNT(m.test_id) AS count_delta
        FROM mock_years y
        LEFT JOIN mock_test_year_memberships m ON m.year_id = y.year_id
        LEFT JOIN mock_tests t ON t.test_id = m.test_id
        GROUP BY y.year_id
        ORDER BY y.display_order ASC
      `).all();

      const totalExpected = years.reduce((sum, y) => sum + (y.expected_listings || 0), 0);
      const totalVerified = years.reduce((sum, y) => sum + (y.verified_listings || 0), 0);
      const totalReady = years.reduce((sum, y) => sum + (y.ready_tests || 0), 0);
      const uniqueTestsCount = mockDb.prepare('SELECT COUNT(*) as cnt FROM mock_tests').get().cnt;
      const uniqueQuestionsCount = mockDb.prepare('SELECT COUNT(*) as cnt FROM mock_questions').get().cnt;

      sendJSON(res, {
        success: true,
        phase: 8,
        title: 'MOCK TESTS',
        total_years: years.length,
        total_expected_listings: totalExpected,
        total_verified_listings: totalVerified,
        total_ready_tests: totalReady,
        total_unique_tests: uniqueTestsCount,
        total_unique_questions: uniqueQuestionsCount,
        years
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/years Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 2. GET /api/mock-tests/years/:yearId/tests - Tests in a year with filters & pagination
  const yearTestsMatch = pathname.match(/^\/api\/mock-tests\/years\/([A-Za-z0-9_-]+)\/tests$/);
  if (method === 'GET' && yearTestsMatch) {
    try {
      if (!mockDb) {
        sendJSON(res, { error: 'Mock Tests database unavailable' }, 503);
        return true;
      }
      let yearKey = yearTestsMatch[1];
      // Allow yearKey to be display_year (e.g. "2027") or year_id ("MOCK-YR-2027")
      let yearRow = mockDb.prepare('SELECT * FROM mock_years WHERE year_id = ? OR display_year = ?').get(yearKey, parseInt(yearKey, 10) || 0);
      if (!yearRow) {
        sendJSON(res, { error: 'Year not found' }, 404);
        return true;
      }

      const yearId = yearRow.year_id;
      const filter = (getParam('filter', 'all') || 'all').toLowerCase();
      const search = (getParam('search', '') || '').trim().toLowerCase();
      const limit = Math.min(250, Math.max(1, parseInt(getParam('limit', '250'), 10)));
      const offset = Math.max(0, parseInt(getParam('offset', '0'), 10));

      let query = `
        SELECT t.test_id, t.source_namespace, t.source_test_id,
               t.exact_title, t.exact_subtitle, t.exam_date,
               t.display_badge, t.mcq_count, t.max_marks,
               t.duration_seconds, t.marking_rules_json,
               t.availability, t.validation_status,
               m.original_listing_order,
               (SELECT COUNT(*) FROM mock_test_question_memberships mtq WHERE mtq.test_id = t.test_id) as actual_question_count
        FROM mock_test_year_memberships m
        JOIN mock_tests t ON m.test_id = t.test_id
        WHERE m.year_id = ?
      `;
      const sqlParams = [yearId];

      if (search) {
        query += ` AND (LOWER(t.exact_title) LIKE ? OR LOWER(t.exact_subtitle) LIKE ?)`;
        sqlParams.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY m.original_listing_order ASC`;
      const allRows = mockDb.prepare(query).all(...sqlParams);

      // Attach student attempt status if sessionsDb available
      const testsWithStatus = allRows.map(test => {
        let attemptInfo = null;
        if (sessionsDb) {
          try {
            const att = sessionsDb.prepare(`
              SELECT attempt_id, is_completed, score, max_marks, accuracy_percent, completed_at
              FROM mock_attempts
              WHERE test_id = ?
              ORDER BY started_at DESC LIMIT 1
            `).get(test.test_id);
            if (att) {
              attemptInfo = {
                attempt_id: att.attempt_id,
                is_completed: att.is_completed === 1,
                score: att.score,
                max_marks: att.max_marks,
                accuracy_percent: att.accuracy_percent,
                completed_at: att.completed_at
              };
            }
          } catch (e) {}
        }

        const isSolved = attemptInfo && attemptInfo.is_completed;
        const isAttempted = attemptInfo && !attemptInfo.is_completed;

        return {
          ...test,
          attempt: attemptInfo,
          is_solved: isSolved,
          is_in_progress: isAttempted
        };
      });

      // Filter unsolved / solved if requested
      let filtered = testsWithStatus;
      if (filter === 'solved') {
        filtered = filtered.filter(t => t.is_solved);
      } else if (filter === 'unsolved') {
        filtered = filtered.filter(t => !t.is_solved);
      } else if (filter === 'attempted') {
        filtered = filtered.filter(t => t.is_in_progress);
      }

      const totalCount = filtered.length;
      const paginated = filtered.slice(offset, offset + limit);

      sendJSON(res, {
        success: true,
        year: yearRow,
        total: totalCount,
        limit,
        offset,
        tests: paginated
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/years/:yearId/tests Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 3. GET /api/mock-tests/tests/:testId - Details and instructions of a test
  const testDetailMatch = pathname.match(/^\/api\/mock-tests\/tests\/([A-Za-z0-9_-]+)$/);
  if (method === 'GET' && testDetailMatch) {
    try {
      if (!mockDb) {
        sendJSON(res, { error: 'Mock Tests database unavailable' }, 503);
        return true;
      }
      const testId = testDetailMatch[1];
      const test = mockDb.prepare(`
        SELECT t.*, m.year_id, m.original_listing_order,
               y.display_year, y.academic_session
        FROM mock_tests t
        LEFT JOIN mock_test_year_memberships m ON m.test_id = t.test_id
        LEFT JOIN mock_years y ON y.year_id = m.year_id
        WHERE t.test_id = ?
      `).get(testId);

      if (!test) {
        sendJSON(res, { error: 'Mock test not found' }, 404);
        return true;
      }

      let attemptInfo = null;
      if (sessionsDb) {
        try {
          const att = sessionsDb.prepare(`
            SELECT attempt_id, is_completed, score, max_marks, accuracy_percent, completed_at, answers_json
            FROM mock_attempts
            WHERE test_id = ?
            ORDER BY started_at DESC LIMIT 1
          `).get(testId);
          if (att) {
            attemptInfo = {
              attempt_id: att.attempt_id,
              is_completed: att.is_completed === 1,
              score: att.score,
              max_marks: att.max_marks,
              accuracy_percent: att.accuracy_percent,
              completed_at: att.completed_at
            };
          }
        } catch (e) {}
      }

      sendJSON(res, {
        success: true,
        test: {
          ...test,
          attempt: attemptInfo
        }
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/tests/:testId Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 4. GET /api/mock-tests/tests/:testId/questions - Questions for active exam
  // MASKING: Omits source_is_correct and explanation_html to prevent answer leakage!
  const testQuestionsMatch = pathname.match(/^\/api\/mock-tests\/tests\/([A-Za-z0-9_-]+)\/questions$/);
  if (method === 'GET' && testQuestionsMatch) {
    try {
      if (!mockDb) {
        sendJSON(res, { error: 'Mock Tests database unavailable' }, 503);
        return true;
      }
      const testId = testQuestionsMatch[1];
      const test = mockDb.prepare('SELECT * FROM mock_tests WHERE test_id = ?').get(testId);
      if (!test) {
        sendJSON(res, { error: 'Mock test not found' }, 404);
        return true;
      }

      const questions = mockDb.prepare(`
        SELECT q.question_id, q.source_namespace, q.source_question_id,
               q.original_stem_html, q.question_type,
               m.display_position, m.question_marks, m.negative_marks
        FROM mock_test_question_memberships m
        JOIN mock_questions q ON q.question_id = m.question_id
        WHERE m.test_id = ?
        ORDER BY m.display_position ASC
      `).all(testId);

      const optionsStmt = mockDb.prepare(`
        SELECT option_id, question_id, original_source_option_id,
               display_position, option_html
        FROM mock_question_options
        WHERE question_id = ?
        ORDER BY display_position ASC
      `);

      const questionsWithOptions = questions.map(q => {
        const opts = optionsStmt.all(q.question_id);
        return {
          question_id: q.question_id,
          display_position: q.display_position,
          stem_html: q.original_stem_html,
          question_type: q.question_type,
          question_marks: q.question_marks,
          negative_marks: q.negative_marks,
          options: opts.map(o => ({
            option_id: o.option_id,
            display_position: o.display_position,
            option_html: o.option_html
          }))
        };
      });

      sendJSON(res, {
        success: true,
        test_id: test.test_id,
        exact_title: test.exact_title,
        exact_subtitle: test.exact_subtitle,
        mcq_count: test.mcq_count,
        max_marks: test.max_marks,
        duration_seconds: test.duration_seconds,
        marking_rules: test.marking_rules_json ? JSON.parse(test.marking_rules_json) : null,
        questions: questionsWithOptions
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/tests/:testId/questions Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 5. POST /api/mock-tests/attempts/start - Start or resume a test attempt
  if (method === 'POST' && pathname === '/api/mock-tests/attempts/start') {
    try {
      if (!sessionsDb) {
        sendJSON(res, { error: 'Sessions store unavailable' }, 503);
        return true;
      }
      const body = await parseBody(req);
      const testId = body.test_id;
      const yearId = body.year_id || '';

      if (!testId) {
        sendJSON(res, { error: 'test_id is required' }, 400);
        return true;
      }

      // Check if test exists
      const test = mockDb.prepare('SELECT * FROM mock_tests WHERE test_id = ?').get(testId);
      if (!test) {
        sendJSON(res, { error: 'Test not found' }, 404);
        return true;
      }

      // Check for an existing in-progress attempt
      const existing = sessionsDb.prepare(`
        SELECT * FROM mock_attempts
        WHERE test_id = ? AND is_completed = 0
        ORDER BY started_at DESC LIMIT 1
      `).get(testId);

      if (existing) {
        sendJSON(res, {
          success: true,
          resumed: true,
          attempt_id: existing.attempt_id,
          test_id: existing.test_id,
          year_id: existing.year_id,
          answers: JSON.parse(existing.answers_json || '{}'),
          marked_for_review: JSON.parse(existing.marked_for_review_json || '[]'),
          time_remaining_seconds: existing.time_remaining_seconds !== null ? existing.time_remaining_seconds : test.duration_seconds,
          started_at: existing.started_at
        });
        return true;
      }

      const attemptId = 'MOCK-ATT-' + crypto.randomUUID();
      const durationSeconds = test.duration_seconds || 1800;

      sessionsDb.prepare(`
        INSERT INTO mock_attempts (
          attempt_id, test_id, year_id, started_at, saved_at,
          answers_json, marked_for_review_json, time_remaining_seconds,
          max_marks, is_completed
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{}', '[]', ?, ?, 0)
      `).run(attemptId, testId, yearId, durationSeconds, test.max_marks || (test.mcq_count * 4));

      sendJSON(res, {
        success: true,
        resumed: false,
        attempt_id: attemptId,
        test_id: testId,
        year_id: yearId,
        answers: {},
        marked_for_review: [],
        time_remaining_seconds: durationSeconds,
        started_at: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/attempts/start Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 6. POST /api/mock-tests/attempts/:attemptId/save - Autosave progress
  const saveAttemptMatch = pathname.match(/^\/api\/mock-tests\/attempts\/([A-Za-z0-9_-]+)\/save$/);
  if (method === 'POST' && saveAttemptMatch) {
    try {
      if (!sessionsDb) {
        sendJSON(res, { error: 'Sessions store unavailable' }, 503);
        return true;
      }
      const attemptId = saveAttemptMatch[1];
      const body = await parseBody(req);
      const answers = body.answers || {};
      const marked = body.marked_for_review || [];
      const timeRemaining = typeof body.time_remaining_seconds === 'number' ? body.time_remaining_seconds : null;
      const timeSpent = typeof body.time_spent_seconds === 'number' ? body.time_spent_seconds : 0;

      sessionsDb.prepare(`
        UPDATE mock_attempts
        SET answers_json = ?, marked_for_review_json = ?,
            time_remaining_seconds = ?, time_spent_seconds = ?,
            saved_at = CURRENT_TIMESTAMP
        WHERE attempt_id = ? AND is_completed = 0
      `).run(JSON.stringify(answers), JSON.stringify(marked), timeRemaining, timeSpent, attemptId);

      sendJSON(res, { success: true, saved_at: new Date().toISOString() });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/attempts/:attemptId/save Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 7. POST /api/mock-tests/attempts/:attemptId/submit - Grade and finalize attempt
  const submitAttemptMatch = pathname.match(/^\/api\/mock-tests\/attempts\/([A-Za-z0-9_-]+)\/submit$/);
  if (method === 'POST' && submitAttemptMatch) {
    try {
      if (!sessionsDb || !mockDb) {
        sendJSON(res, { error: 'Databases unavailable' }, 503);
        return true;
      }
      const attemptId = submitAttemptMatch[1];
      const body = await parseBody(req);
      const answers = body.answers || {};
      const timeSpent = typeof body.time_spent_seconds === 'number' ? body.time_spent_seconds : 0;

      const attempt = sessionsDb.prepare('SELECT * FROM mock_attempts WHERE attempt_id = ?').get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      // Fetch official answer keys
      const questions = mockDb.prepare(`
        SELECT m.question_id, m.display_position, m.question_marks, m.negative_marks
        FROM mock_test_question_memberships m
        WHERE m.test_id = ?
        ORDER BY m.display_position ASC
      `).all(attempt.test_id);

      const correctOptStmt = mockDb.prepare(`
        SELECT display_position FROM mock_question_options
        WHERE question_id = ? AND source_is_correct = 1
        LIMIT 1
      `);

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let totalScore = 0;
      const totalQuestions = questions.length;
      const maxMarks = questions.reduce((sum, q) => sum + (q.question_marks || 4.0), 0);

      questions.forEach(q => {
        const correctRow = correctOptStmt.get(q.question_id);
        const correctPos = correctRow ? correctRow.display_position : 1;
        const studentChoice = answers[q.question_id];

        if (studentChoice === undefined || studentChoice === null || studentChoice === 0) {
          unattemptedCount++;
        } else if (Number(studentChoice) === Number(correctPos)) {
          correctCount++;
          totalScore += (q.question_marks || 4.0);
        } else {
          incorrectCount++;
          totalScore -= (q.negative_marks || 1.0);
        }
      });

      const accuracy = (correctCount + incorrectCount) > 0
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100 * 10) / 10
        : 0;

      sessionsDb.prepare(`
        UPDATE mock_attempts
        SET answers_json = ?, is_completed = 1, completed_at = CURRENT_TIMESTAMP,
            time_spent_seconds = ?, time_remaining_seconds = 0,
            score = ?, max_marks = ?, accuracy_percent = ?,
            correct_count = ?, incorrect_count = ?, unattempted_count = ?
        WHERE attempt_id = ?
      `).run(
        JSON.stringify(answers), timeSpent,
        totalScore, maxMarks, accuracy,
        correctCount, incorrectCount, unattemptedCount,
        attemptId
      );

      sendJSON(res, {
        success: true,
        attempt_id: attemptId,
        score: totalScore,
        max_marks: maxMarks,
        accuracy_percent: accuracy,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/attempts/:attemptId/submit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 8. GET /api/mock-tests/attempts/:attemptId/results - Detailed scorecard with explanations
  const resultsAttemptMatch = pathname.match(/^\/api\/mock-tests\/attempts\/([A-Za-z0-9_-]+)\/results$/);
  if (method === 'GET' && resultsAttemptMatch) {
    try {
      if (!sessionsDb || !mockDb) {
        sendJSON(res, { error: 'Databases unavailable' }, 503);
        return true;
      }
      const attemptId = resultsAttemptMatch[1];
      const attempt = sessionsDb.prepare('SELECT * FROM mock_attempts WHERE attempt_id = ?').get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const test = mockDb.prepare('SELECT * FROM mock_tests WHERE test_id = ?').get(attempt.test_id);
      const studentAnswers = JSON.parse(attempt.answers_json || '{}');

      // Fetch questions with full explanations & verified correct answers
      const questions = mockDb.prepare(`
        SELECT q.question_id, q.original_stem_html, q.question_type, q.explanation_html,
               m.display_position, m.question_marks, m.negative_marks
        FROM mock_test_question_memberships m
        JOIN mock_questions q ON q.question_id = m.question_id
        WHERE m.test_id = ?
        ORDER BY m.display_position ASC
      `).all(attempt.test_id);

      const optionsStmt = mockDb.prepare(`
        SELECT option_id, question_id, original_source_option_id,
               display_position, option_html, source_is_correct
        FROM mock_question_options
        WHERE question_id = ?
        ORDER BY display_position ASC
      `);

      const reviewQuestions = questions.map(q => {
        const opts = optionsStmt.all(q.question_id);
        const correctOpt = opts.find(o => o.source_is_correct === 1);
        const correctPos = correctOpt ? correctOpt.display_position : 1;
        const studentChoice = studentAnswers[q.question_id] !== undefined ? Number(studentAnswers[q.question_id]) : 0;
        const isCorrect = studentChoice === correctPos;
        const isUnattempted = studentChoice === 0;

        return {
          question_id: q.question_id,
          display_position: q.display_position,
          stem_html: q.original_stem_html,
          question_type: q.question_type,
          explanation_html: q.explanation_html,
          student_choice: studentChoice,
          correct_choice: correctPos,
          is_correct: isCorrect,
          is_unattempted: isUnattempted,
          question_marks: q.question_marks,
          negative_marks: q.negative_marks,
          options: opts.map(o => ({
            option_id: o.option_id,
            display_position: o.display_position,
            option_html: o.option_html,
            is_correct: o.source_is_correct === 1
          }))
        };
      });

      sendJSON(res, {
        success: true,
        attempt: {
          attempt_id: attempt.attempt_id,
          test_id: attempt.test_id,
          year_id: attempt.year_id,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          time_spent_seconds: attempt.time_spent_seconds,
          score: attempt.score,
          max_marks: attempt.max_marks,
          accuracy_percent: attempt.accuracy_percent,
          correct_count: attempt.correct_count,
          incorrect_count: attempt.incorrect_count,
          unattempted_count: attempt.unattempted_count,
          total_questions: reviewQuestions.length
        },
        test: {
          test_id: test.test_id,
          exact_title: test.exact_title,
          exact_subtitle: test.exact_subtitle,
          display_badge: test.display_badge,
          exam_date: test.exam_date
        },
        questions: reviewQuestions
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/attempts/:attemptId/results Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 9. GET /api/mock-tests/audit - Runtime audit endpoint
  if (method === 'GET' && pathname === '/api/mock-tests/audit') {
    try {
      if (!mockDb) {
        sendJSON(res, { error: 'Mock Tests database unavailable' }, 503);
        return true;
      }
      const years = mockDb.prepare('SELECT * FROM mock_years ORDER BY display_order ASC').all();
      const byYear = years.map(y => {
        const tests = mockDb.prepare(`
          SELECT t.test_id, t.mcq_count, t.validation_status, t.availability
          FROM mock_test_year_memberships m
          JOIN mock_tests t ON t.test_id=m.test_id
          WHERE m.year_id=? ORDER BY m.original_listing_order
        `).all(y.year_id);

        const titleVerified = tests.filter(t => t.validation_status === 'verified').length;
        const restricted = tests.filter(t => ['restricted', 'unavailable'].includes(t.availability)).length;
        let readyCount = 0;
        let questionMemberships = 0;

        tests.forEach(t => {
          const qCount = mockDb.prepare('SELECT COUNT(*) as cnt FROM mock_test_question_memberships WHERE test_id=?').get(t.test_id).cnt;
          questionMemberships += qCount;
          if (qCount === t.mcq_count && t.validation_status === 'verified' && t.availability === 'available') {
            readyCount++;
          }
        });

        const listed = tests.length;
        const expected = y.expected_listings;

        return {
          year: y.display_year,
          academic_session: y.academic_session,
          expected_test_listings: expected,
          fetched_listings: listed,
          verified_test_metadata: titleVerified,
          practice_ready_tests: readyCount,
          restricted_or_unavailable_tests: restricted,
          question_memberships_present: questionMemberships,
          remaining_expected_listings: Math.max(expected - listed, 0),
          count_delta: listed - expected,
          status: (listed === expected && titleVerified === expected && readyCount === expected) ? 'complete' : 'incomplete'
        };
      });

      const overallStatus = byYear.every(y => y.status === 'complete') ? 'complete' : 'incomplete';

      sendJSON(res, {
        module: 'mock_tests',
        overall_status: overallStatus,
        expected_listings: byYear.reduce((s, y) => s + y.expected_test_listings, 0),
        fetched_listings: byYear.reduce((s, y) => s + y.fetched_listings, 0),
        distinct_source_tests: mockDb.prepare('SELECT COUNT(*) as cnt FROM mock_tests').get().cnt,
        distinct_source_questions: mockDb.prepare('SELECT COUNT(*) as cnt FROM mock_questions').get().cnt,
        source_request_evidence_records: mockDb.prepare('SELECT COUNT(*) as cnt FROM source_requests').get().cnt,
        unresolved_issues: mockDb.prepare('SELECT COUNT(*) as cnt FROM extraction_issues WHERE resolved_at IS NULL').get().cnt,
        by_year: byYear
      });
      return true;
    } catch (e) {
      console.error('[API /api/mock-tests/audit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  return false;
}

module.exports = { handleMockTestsRoutes };
