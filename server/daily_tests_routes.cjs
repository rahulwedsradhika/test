/**
 * AyurvedSiddhi Phase 7 — Daily Tests Routes Handler
 * Handles:
 *  - GET /api/daily-tests/sessions
 *  - GET /api/daily-tests/sessions/:sessionId/tests
 *  - GET /api/daily-tests/tests/:testUid
 *  - GET /api/daily-tests/tests/:testUid/questions
 *  - POST /api/daily-tests/attempts/start
 *  - POST /api/daily-tests/attempts/:attemptId/save
 *  - POST /api/daily-tests/attempts/:attemptId/submit
 *  - GET /api/daily-tests/attempts/:attemptId/results
 *  - GET /api/daily-tests/audit
 */

const crypto = require('crypto');

async function handleDailyTestsRoutes(req, res, pathname, method, params, dailyDb, sessionsDb, sendJSON, parseBody) {
  const getParam = (k, fb = '') => (params && typeof params.get === 'function' ? params.get(k) : (params ? params[k] : null)) || fb;

  // 1. GET /api/daily-tests/sessions - List all 3 sessions with counts & metadata
  if (method === 'GET' && pathname === '/api/daily-tests/sessions') {
    try {
      if (!dailyDb) {
        return sendJSON(res, { error: 'Daily Tests database unavailable' }, 503);
      }
      const sessions = dailyDb.prepare(`
        SELECT s.local_session_id, s.display_order, s.session_year,
               s.expected_test_listings_owner, s.expected_count_origin,
               s.original_route_hint, s.route_verified, s.native_session_id,
               s.source_advertised_test_count, s.ingestion_status,
               COUNT(m.test_uid) AS verified_catalog_memberships,
               SUM(CASE WHEN t.validation_state='questions_verified' AND t.access_state='authorized' THEN 1 ELSE 0 END) AS ready_tests,
               SUM(CASE WHEN t.access_state='restricted' THEN 1 ELSE 0 END) AS restricted_tests,
               s.expected_test_listings_owner - COUNT(m.test_uid) AS difference_from_owner_expected
        FROM daily_sessions s
        LEFT JOIN daily_test_session_memberships m ON m.local_session_id = s.local_session_id
        LEFT JOIN daily_tests t ON t.test_uid = m.test_uid
        GROUP BY s.local_session_id
        ORDER BY s.display_order ASC
      `).all();

      const totalExpected = sessions.reduce((sum, s) => sum + (s.expected_test_listings_owner || 0), 0);
      const totalCatalogued = sessions.reduce((sum, s) => sum + (s.verified_catalog_memberships || 0), 0);
      const totalReady = sessions.reduce((sum, s) => sum + (s.ready_tests || 0), 0);
      const uniqueTestsCount = dailyDb.prepare('SELECT COUNT(*) as cnt FROM daily_tests').get().cnt;
      const uniqueQuestionsCount = dailyDb.prepare('SELECT COUNT(*) as cnt FROM daily_questions').get().cnt;

      sendJSON(res, {
        success: true,
        phase: 7,
        title: 'DAILY TESTS',
        total_sessions: sessions.length,
        total_expected_listings: totalExpected,
        total_catalogued_memberships: totalCatalogued,
        total_ready_tests: totalReady,
        total_unique_tests: uniqueTestsCount,
        total_unique_questions: uniqueQuestionsCount,
        sessions
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/sessions Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 2. GET /api/daily-tests/sessions/:sessionId/tests - Tests in a session with filters & pagination
  const sessionTestsMatch = pathname.match(/^\/api\/daily-tests\/sessions\/(DLY-[0-9]{4}-[0-9]{4})\/tests$/);
  if (method === 'GET' && sessionTestsMatch) {
    try {
      if (!dailyDb) {
        sendJSON(res, { error: 'Daily Tests database unavailable' }, 503);
        return true;
      }
      const sessionId = sessionTestsMatch[1];
      const filter = (getParam('filter', 'all') || 'all').toLowerCase();
      const search = (getParam('search', '') || '').trim().toLowerCase();
      const limit = Math.min(250, Math.max(1, parseInt(getParam('limit', '100'), 10)));
      const offset = Math.max(0, parseInt(getParam('offset', '0'), 10));

      const session = dailyDb.prepare('SELECT * FROM daily_sessions WHERE local_session_id = ?').get(sessionId);
      if (!session) {
        sendJSON(res, { error: 'Session not found' }, 404);
        return true;
      }

      let query = `
        SELECT t.test_uid, t.source_namespace, t.native_test_id,
               t.original_title, t.original_subtitle, t.original_description,
               t.source_date_text, t.source_badge_text, t.source_display_order,
               t.declared_mcq_count, t.declared_marks, t.duration_seconds,
               t.access_state, t.validation_state, m.source_display_order as session_position,
               (SELECT COUNT(*) FROM daily_test_questions dtq WHERE dtq.test_uid = t.test_uid) as actual_question_count
        FROM daily_test_session_memberships m
        JOIN daily_tests t ON m.test_uid = t.test_uid
        WHERE m.local_session_id = ?
      `;
      const sqlParams = [sessionId];

      if (search) {
        query += ` AND (LOWER(t.original_title) LIKE ? OR LOWER(COALESCE(t.original_subtitle, '')) LIKE ?)`;
        sqlParams.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY m.source_display_order ASC`;

      const allRows = dailyDb.prepare(query).all(...sqlParams);

      // Check solved status from sessionsDb if available
      let solvedTestUids = new Set();
      if (sessionsDb) {
        try {
          const solvedRows = sessionsDb.prepare(`
            SELECT DISTINCT test_uid FROM daily_attempts WHERE is_completed = 1
          `).all();
          solvedTestUids = new Set(solvedRows.map(r => r.test_uid));
        } catch (_) {}
      }

      // Map rows with student_solved flag and is_ready
      let tests = allRows.map(r => {
        const isSolved = solvedTestUids.has(r.test_uid);
        const isReady = r.validation_state === 'questions_verified' && r.access_state === 'authorized' && r.actual_question_count > 0;
        return {
          ...r,
          is_ready: isReady,
          student_solved: isSolved
        };
      });

      // Apply Solved / Un Solved filter
      if (filter === 'solved') {
        tests = tests.filter(t => t.student_solved);
      } else if (filter === 'unsolved' || filter === 'un solved') {
        tests = tests.filter(t => !t.student_solved);
      }

      const totalCount = tests.length;
      const paginatedTests = tests.slice(offset, offset + limit);

      sendJSON(res, {
        success: true,
        session: {
          local_session_id: session.local_session_id,
          session_year: session.session_year,
          expected_test_listings_owner: session.expected_test_listings_owner
        },
        filter,
        total: totalCount,
        limit,
        offset,
        tests: paginatedTests
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/sessions/:id/tests Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 3. GET /api/daily-tests/tests/:testUid - Single test details
  const testDetailMatch = pathname.match(/^\/api\/daily-tests\/tests\/([A-Za-z0-9_-]+)$/);
  if (method === 'GET' && testDetailMatch) {
    try {
      if (!dailyDb) {
        sendJSON(res, { error: 'Daily Tests database unavailable' }, 503);
        return true;
      }
      const testUid = testDetailMatch[1];
      const test = dailyDb.prepare(`
        SELECT t.*,
               (SELECT COUNT(*) FROM daily_test_questions dtq WHERE dtq.test_uid = t.test_uid) as actual_question_count
        FROM daily_tests t
        WHERE t.test_uid = ?
      `).get(testUid);

      if (!test) {
        sendJSON(res, { error: 'Daily test not found' }, 404);
        return true;
      }

      const memberships = dailyDb.prepare(`
        SELECT m.local_session_id, s.session_year, m.source_display_order
        FROM daily_test_session_memberships m
        JOIN daily_sessions s ON m.local_session_id = s.local_session_id
        WHERE m.test_uid = ?
        ORDER BY s.display_order ASC
      `).all(testUid);

      let studentSolved = false;
      let lastAttempt = null;
      if (sessionsDb) {
        try {
          const attempt = sessionsDb.prepare(`
            SELECT attempt_id, score, is_completed, completed_at
            FROM daily_attempts
            WHERE test_uid = ? AND is_completed = 1
            ORDER BY completed_at DESC
            LIMIT 1
          `).get(testUid);
          if (attempt) {
            studentSolved = true;
            lastAttempt = attempt;
          }
        } catch (_) {}
      }

      const isReady = test.validation_state === 'questions_verified' && test.access_state === 'authorized' && test.actual_question_count > 0;

      sendJSON(res, {
        success: true,
        test: {
          ...test,
          is_ready: isReady,
          student_solved: studentSolved,
          last_attempt: lastAttempt,
          sessions: memberships
        }
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/tests/:testUid Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 4. GET /api/daily-tests/tests/:testUid/questions - Questions for Exam mode (answers redacted)
  const testQuestionsMatch = pathname.match(/^\/api\/daily-tests\/tests\/([A-Za-z0-9_-]+)\/questions$/);
  if (method === 'GET' && testQuestionsMatch) {
    try {
      if (!dailyDb) {
        sendJSON(res, { error: 'Daily Tests database unavailable' }, 503);
        return true;
      }
      const testUid = testQuestionsMatch[1];
      const test = dailyDb.prepare('SELECT * FROM daily_tests WHERE test_uid = ?').get(testUid);
      if (!test) {
        sendJSON(res, { error: 'Daily test not found' }, 404);
        return true;
      }

      const questions = dailyDb.prepare(`
        SELECT q.question_uid, dtq.position, q.stem_original as stem,
               q.question_type_source as question_type, q.source_marks as marks
        FROM daily_test_questions dtq
        JOIN daily_questions q ON dtq.question_uid = q.question_uid
        WHERE dtq.test_uid = ?
        ORDER BY dtq.position ASC
      `).all(testUid);

      if (questions.length === 0) {
        sendJSON(res, { error: 'No verified questions currently available for this test' }, 404);
        return true;
      }

      // Fetch options for each question
      const optStmt = dailyDb.prepare(`
        SELECT option_uid, position, option_text_original as text
        FROM daily_question_options
        WHERE question_uid = ?
        ORDER BY position ASC
      `);

      const questionsPayload = questions.map(q => {
        const opts = optStmt.all(q.question_uid);
        return {
          question_uid: q.question_uid,
          position: q.position,
          stem: q.stem,
          question_type: q.question_type,
          marks: q.marks,
          options: opts
        };
      });

      sendJSON(res, {
        success: true,
        test_uid: test.test_uid,
        title: test.original_title,
        subtitle: test.original_subtitle,
        duration_seconds: test.duration_seconds || (45 * 60),
        total_questions: questionsPayload.length,
        declared_marks: test.declared_marks || 200,
        questions: questionsPayload
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/tests/:testUid/questions Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 5. POST /api/daily-tests/attempts/start - Start a new attempt
  if (method === 'POST' && pathname === '/api/daily-tests/attempts/start') {
    try {
      if (!sessionsDb || !dailyDb) {
        sendJSON(res, { error: 'Database service unavailable' }, 503);
        return true;
      }
      const body = await parseBody(req);
      const testUid = body.test_uid;
      const sessionId = body.session_id || 'DLY-2026-2027';

      if (!testUid) {
        sendJSON(res, { error: 'test_uid is required' }, 400);
        return true;
      }

      const test = dailyDb.prepare('SELECT * FROM daily_tests WHERE test_uid = ?').get(testUid);
      if (!test) {
        sendJSON(res, { error: 'Daily test not found' }, 404);
        return true;
      }

      const attemptId = 'DLY-ATT-' + crypto.randomBytes(8).toString('hex');
      const now = new Date().toISOString();

      sessionsDb.prepare(`
        INSERT INTO daily_attempts (
          attempt_id, test_uid, session_id, started_at, saved_at,
          answers_json, is_completed
        ) VALUES (?, ?, ?, ?, ?, '{}', 0)
      `).run(attemptId, testUid, sessionId, now, now);

      sendJSON(res, {
        success: true,
        attempt_id: attemptId,
        test_uid: testUid,
        session_id: sessionId,
        started_at: now,
        duration_seconds: test.duration_seconds || (45 * 60)
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/attempts/start Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 6. POST /api/daily-tests/attempts/:attemptId/save - Autosave progress
  const attemptSaveMatch = pathname.match(/^\/api\/daily-tests\/attempts\/([A-Za-z0-9_-]+)\/save$/);
  if (method === 'POST' && attemptSaveMatch) {
    try {
      if (!sessionsDb) {
        sendJSON(res, { error: 'Sessions DB unavailable' }, 503);
        return true;
      }
      const attemptId = attemptSaveMatch[1];
      const body = await parseBody(req);
      const answers = body.answers || {};

      const attempt = sessionsDb.prepare('SELECT * FROM daily_attempts WHERE attempt_id = ?').get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const now = new Date().toISOString();
      sessionsDb.prepare(`
        UPDATE daily_attempts
        SET answers_json = ?, saved_at = ?
        WHERE attempt_id = ?
      `).run(JSON.stringify(answers), now, attemptId);

      sendJSON(res, { success: true, attempt_id: attemptId, saved_at: now });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/attempts/:attemptId/save Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 7. POST /api/daily-tests/attempts/:attemptId/submit - Submit and score
  const attemptSubmitMatch = pathname.match(/^\/api\/daily-tests\/attempts\/([A-Za-z0-9_-]+)\/submit$/);
  if (method === 'POST' && attemptSubmitMatch) {
    try {
      if (!sessionsDb || !dailyDb) {
        sendJSON(res, { error: 'Database service unavailable' }, 503);
        return true;
      }
      const attemptId = attemptSubmitMatch[1];
      const body = await parseBody(req);
      const submittedAnswers = body.answers || {};

      const attempt = sessionsDb.prepare('SELECT * FROM daily_attempts WHERE attempt_id = ?').get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const testUid = attempt.test_uid;
      const questions = dailyDb.prepare(`
        SELECT q.question_uid, dtq.position, q.source_correct_answer_json, q.source_marks
        FROM daily_test_questions dtq
        JOIN daily_questions q ON dtq.question_uid = q.question_uid
        WHERE dtq.test_uid = ?
        ORDER BY dtq.position ASC
      `).all(testUid);

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let totalScore = 0.0;
      const marksPerCorrect = 4.0;
      const negativeMarks = 1.0;

      for (const q of questions) {
        const studentAns = submittedAnswers[q.question_uid];
        let correctArr = [];
        try {
          correctArr = JSON.parse(q.source_correct_answer_json || '[]');
        } catch (_) {}
        const correctPos = correctArr.length > 0 ? correctArr[0] : null;

        if (studentAns === undefined || studentAns === null || studentAns === '') {
          unattemptedCount++;
        } else if (Number(studentAns) === Number(correctPos)) {
          correctCount++;
          totalScore += marksPerCorrect;
        } else {
          incorrectCount++;
          totalScore -= negativeMarks;
        }
      }

      const totalQuestions = questions.length;
      const maxMarks = totalQuestions * marksPerCorrect;
      const percentage = maxMarks > 0 ? Math.max(0, (totalScore / maxMarks) * 100) : 0;
      const accuracy = (correctCount + incorrectCount) > 0 ? (correctCount / (correctCount + incorrectCount)) * 100 : 0;
      const now = new Date().toISOString();

      sessionsDb.prepare(`
        UPDATE daily_attempts
        SET answers_json = ?,
            score = ?,
            total_questions = ?,
            correct_count = ?,
            incorrect_count = ?,
            unattempted_count = ?,
            is_completed = 1,
            completed_at = ?
        WHERE attempt_id = ?
      `).run(
        JSON.stringify(submittedAnswers),
        totalScore,
        totalQuestions,
        correctCount,
        incorrectCount,
        unattemptedCount,
        now,
        attemptId
      );

      sendJSON(res, {
        success: true,
        attempt_id: attemptId,
        test_uid: testUid,
        score: totalScore,
        max_marks: maxMarks,
        total_questions: totalQuestions,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        percentage: parseFloat(percentage.toFixed(2)),
        accuracy: parseFloat(accuracy.toFixed(2)),
        completed_at: now
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/attempts/:attemptId/submit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 8. GET /api/daily-tests/attempts/:attemptId/results - Scorecard and full answer review
  const attemptResultsMatch = pathname.match(/^\/api\/daily-tests\/attempts\/([A-Za-z0-9_-]+)\/results$/);
  if (method === 'GET' && attemptResultsMatch) {
    try {
      if (!sessionsDb || !dailyDb) {
        sendJSON(res, { error: 'Database service unavailable' }, 503);
        return true;
      }
      const attemptId = attemptResultsMatch[1];
      const attempt = sessionsDb.prepare('SELECT * FROM daily_attempts WHERE attempt_id = ?').get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const test = dailyDb.prepare('SELECT * FROM daily_tests WHERE test_uid = ?').get(attempt.test_uid);
      const studentAnswers = JSON.parse(attempt.answers_json || '{}');

      const questions = dailyDb.prepare(`
        SELECT q.question_uid, dtq.position, q.stem_original as stem,
               q.question_type_source as question_type, q.source_marks as marks,
               q.source_correct_answer_json, q.source_explanation_original as explanation
        FROM daily_test_questions dtq
        JOIN daily_questions q ON dtq.question_uid = q.question_uid
        WHERE dtq.test_uid = ?
        ORDER BY dtq.position ASC
      `).all(attempt.test_uid);

      const optStmt = dailyDb.prepare(`
        SELECT option_uid, position, option_text_original as text
        FROM daily_question_options
        WHERE question_uid = ?
        ORDER BY position ASC
      `);

      const reviewQuestions = questions.map(q => {
        const opts = optStmt.all(q.question_uid);
        let correctArr = [];
        try {
          correctArr = JSON.parse(q.source_correct_answer_json || '[]');
        } catch (_) {}
        const correctPos = correctArr.length > 0 ? correctArr[0] : null;
        const studentPos = studentAnswers[q.question_uid] !== undefined ? Number(studentAnswers[q.question_uid]) : null;

        let status = 'unattempted';
        if (studentPos !== null) {
          status = (studentPos === correctPos) ? 'correct' : 'incorrect';
        }

        return {
          question_uid: q.question_uid,
          position: q.position,
          stem: q.stem,
          question_type: q.question_type,
          marks: q.marks,
          options: opts,
          student_selected_position: studentPos,
          correct_answer_position: correctPos,
          explanation: q.explanation,
          status
        };
      });

      const totalQ = questions.length;
      const maxMarks = totalQ * 4.0;
      const score = attempt.score !== null ? attempt.score : 0;
      const percentage = maxMarks > 0 ? Math.max(0, (score / maxMarks) * 100) : 0;
      const correctCount = attempt.correct_count || 0;
      const incorrectCount = attempt.incorrect_count || 0;
      const accuracy = (correctCount + incorrectCount) > 0 ? (correctCount / (correctCount + incorrectCount)) * 100 : 0;

      sendJSON(res, {
        success: true,
        attempt: {
          attempt_id: attempt.attempt_id,
          test_uid: attempt.test_uid,
          test_title: test ? test.original_title : 'Daily Test',
          test_subtitle: test ? test.original_subtitle : null,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          score,
          max_marks: maxMarks,
          total_questions: totalQ,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          unattempted_count: attempt.unattempted_count || (totalQ - correctCount - incorrectCount),
          percentage: parseFloat(percentage.toFixed(2)),
          accuracy: parseFloat(accuracy.toFixed(2))
        },
        questions: reviewQuestions
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/attempts/:attemptId/results Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 9. GET /api/daily-tests/audit - Reconciliation and coverage stats
  if (method === 'GET' && pathname === '/api/daily-tests/audit') {
    try {
      if (!dailyDb) {
        sendJSON(res, { error: 'Daily Tests database unavailable' }, 503);
        return true;
      }
      const coverageRows = dailyDb.prepare(`
        SELECT * FROM daily_session_coverage ORDER BY session_year DESC
      `).all();

      const totalDistinctTests = dailyDb.prepare('SELECT COUNT(*) as cnt FROM daily_tests').get().cnt;
      const totalQuestions = dailyDb.prepare('SELECT COUNT(*) as cnt FROM daily_questions').get().cnt;
      const verifiedAnswersCount = dailyDb.prepare("SELECT COUNT(*) as cnt FROM daily_questions WHERE validation_state='ready' AND answer_verified=1").get().cnt;

      sendJSON(res, {
        success: true,
        phase: 7,
        audit: {
          sessions: coverageRows,
          distinct_verified_catalog_tests: totalDistinctTests,
          questions_total: totalQuestions,
          source_answer_verified_ready_questions: verifiedAnswersCount,
          owner_expected_listings: 750
        }
      });
      return true;
    } catch (e) {
      console.error('[API /api/daily-tests/audit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  return false;
}

module.exports = { handleDailyTestsRoutes };
