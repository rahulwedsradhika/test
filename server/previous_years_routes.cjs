/**
 * AyurvedSiddhi Phase 6 — Previous Year Papers Routes Handler
 * Handles:
 *  - GET /api/previous-years/groups
 *  - GET /api/previous-years/groups/:groupId
 *  - GET /api/previous-years/groups/:groupId/tests
 *  - GET /api/previous-years/tests/:testId
 *  - GET /api/previous-years/tests/:testId/questions
 *  - POST /api/previous-years/attempts/start
 *  - POST /api/previous-years/attempts/:attemptId/save
 *  - POST /api/previous-years/attempts/:attemptId/submit
 *  - GET /api/previous-years/attempts/:attemptId/results
 *  - GET /api/previous-years/audit
 */

const crypto = require('crypto');

async function handlePreviousYearsRoutes(req, res, pathname, method, params, pypDb, sessionsDb, sendJSON, parseBody) {
  const getParam = (k, fb = '') => (params && typeof params.get === 'function' ? params.get(k) : (params ? params[k] : null)) || fb;

  // 1. GET /api/previous-years/groups - List all 3 groups
  if (method === 'GET' && pathname === '/api/previous-years/groups') {
    try {
      if (!pypDb) {
        return sendJSON(res, { error: 'Previous Year Papers database unavailable' }, 503);
      }
      const groups = pypDb.prepare(`
        SELECT g.local_group_id, g.display_order, g.screenshot_label_exact,
               g.screenshot_description_exact, g.user_description_alias,
               g.expected_test_count, g.native_group_id, g.source_entitlement_state,
               g.ingestion_status,
               COUNT(m.test_uid) as catalogued_test_memberships,
               COUNT(CASE WHEN t.validation_state = 'questions_verified' THEN 1 END) as ready_test_memberships
        FROM previous_year_groups g
        LEFT JOIN test_group_memberships m ON g.local_group_id = m.local_group_id
        LEFT JOIN source_tests t ON m.test_uid = t.test_uid
        GROUP BY g.local_group_id
        ORDER BY g.display_order ASC
      `).all();

      const totalExpected = groups.reduce((sum, g) => sum + (g.expected_test_count || 0), 0);
      const totalCatalogued = groups.reduce((sum, g) => sum + (g.catalogued_test_memberships || 0), 0);
      const totalReady = groups.reduce((sum, g) => sum + (g.ready_test_memberships || 0), 0);

      const uniqueTestsCount = pypDb.prepare('SELECT COUNT(*) as cnt FROM source_tests').get().cnt;
      const uniqueQuestionsCount = pypDb.prepare('SELECT COUNT(*) as cnt FROM source_questions').get().cnt;

      sendJSON(res, {
        success: true,
        phase: 6,
        title: 'PREVIOUS YEAR PAPERS',
        total_groups: groups.length,
        total_expected_memberships: totalExpected,
        total_catalogued_memberships: totalCatalogued,
        total_ready_memberships: totalReady,
        total_unique_tests: uniqueTestsCount,
        total_unique_questions: uniqueQuestionsCount,
        groups
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/groups Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 2. GET /api/previous-years/groups/:groupId/tests - Tests in a group with filter & pagination
  const groupTestsMatch = pathname.match(/^\/api\/previous-years\/groups\/(PYP-[A-Z]+)\/tests$/);
  if (method === 'GET' && groupTestsMatch) {
    try {
      if (!pypDb) {
        sendJSON(res, { error: 'Previous Year Papers database unavailable' }, 503);
        return true;
      }
      const groupId = groupTestsMatch[1];
      const search = (getParam('search', '') || '').trim().toLowerCase();
      const year = (getParam('year', '') || '').trim();
      const limit = Math.min(200, Math.max(1, parseInt(getParam('limit', '150'), 10)));
      const offset = Math.max(0, parseInt(getParam('offset', '0'), 10));

      const group = pypDb.prepare('SELECT * FROM previous_year_groups WHERE local_group_id = ?').get(groupId);
      if (!group) {
        sendJSON(res, { error: 'Group not found' }, 404);
        return true;
      }

      let query = `
        SELECT t.test_uid, t.source_native_test_id, t.title_source_exact,
               t.exam_year_source, t.exam_type_source, t.scheduled_date_source,
               t.duration_seconds_source, t.max_marks_source, t.negative_marking_source,
               t.expected_question_count_source, t.availability_source, t.access_state,
               t.validation_state, m.source_position,
               (SELECT COUNT(*) FROM test_question_memberships tqm WHERE tqm.test_uid = t.test_uid) as actual_question_count
        FROM test_group_memberships m
        JOIN source_tests t ON m.test_uid = t.test_uid
        WHERE m.local_group_id = ?
      `;
      const sqlParams = [groupId];

      if (search) {
        query += ` AND (LOWER(t.title_source_exact) LIKE ? OR LOWER(t.exam_year_source) LIKE ?)`;
        sqlParams.push(`%${search}%`, `%${search}%`);
      }
      if (year) {
        query += ` AND t.exam_year_source = ?`;
        sqlParams.push(year);
      }

      query += ` ORDER BY m.source_position ASC LIMIT ? OFFSET ?`;
      sqlParams.push(limit, offset);

      const tests = pypDb.prepare(query).all(...sqlParams);

      // Available years for filter tabs
      const availableYears = pypDb.prepare(`
        SELECT DISTINCT t.exam_year_source as yr
        FROM test_group_memberships m
        JOIN source_tests t ON m.test_uid = t.test_uid
        WHERE m.local_group_id = ? AND t.exam_year_source IS NOT NULL AND trim(t.exam_year_source) != ''
        ORDER BY t.exam_year_source DESC
      `).all(groupId).map(r => r.yr);

      sendJSON(res, {
        success: true,
        group,
        total: tests.length,
        available_years: availableYears,
        tests
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/groups/:groupId/tests Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 3. GET /api/previous-years/groups/:groupId - Single group details
  const singleGroupMatch = pathname.match(/^\/api\/previous-years\/groups\/(PYP-[A-Z]+)$/);
  if (method === 'GET' && singleGroupMatch) {
    try {
      if (!pypDb) {
        sendJSON(res, { error: 'Previous Year Papers database unavailable' }, 503);
        return true;
      }
      const groupId = singleGroupMatch[1];
      const group = pypDb.prepare(`
        SELECT g.*,
               COUNT(m.test_uid) as catalogued_test_memberships,
               COUNT(CASE WHEN t.validation_state = 'questions_verified' THEN 1 END) as ready_test_memberships
        FROM previous_year_groups g
        LEFT JOIN test_group_memberships m ON g.local_group_id = m.local_group_id
        LEFT JOIN source_tests t ON m.test_uid = t.test_uid
        WHERE g.local_group_id = ?
        GROUP BY g.local_group_id
      `).get(groupId);

      if (!group) {
        sendJSON(res, { error: 'Group not found' }, 404);
        return true;
      }
      sendJSON(res, { success: true, group });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/groups/:groupId Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 4. GET /api/previous-years/tests/:testId - Specific test metadata
  const singleTestMatch = pathname.match(/^\/api\/previous-years\/tests\/(PYP-T-[a-f0-9]+)$/);
  if (method === 'GET' && singleTestMatch) {
    try {
      if (!pypDb) {
        sendJSON(res, { error: 'Previous Year Papers database unavailable' }, 503);
        return true;
      }
      const testId = singleTestMatch[1];
      const test = pypDb.prepare(`
        SELECT t.*,
               (SELECT COUNT(*) FROM test_question_memberships tqm WHERE tqm.test_uid = t.test_uid) as actual_question_count
        FROM source_tests t
        WHERE t.test_uid = ?
      `).get(testId);

      if (!test) {
        sendJSON(res, { error: 'Test not found' }, 404);
        return true;
      }

      // Fetch group memberships for this test
      const memberships = pypDb.prepare(`
        SELECT m.local_group_id, g.screenshot_label_exact, m.source_position
        FROM test_group_memberships m
        JOIN previous_year_groups g ON m.local_group_id = g.local_group_id
        WHERE m.test_uid = ?
        ORDER BY g.display_order ASC
      `).all(testId);

      sendJSON(res, {
        success: true,
        test: {
          ...test,
          memberships
        }
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/tests/:testId Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 5. GET /api/previous-years/tests/:testId/questions - Questions for test
  const testQuestionsMatch = pathname.match(/^\/api\/previous-years\/tests\/(PYP-T-[a-f0-9]+)\/questions$/);
  if (method === 'GET' && testQuestionsMatch) {
    try {
      if (!pypDb) {
        sendJSON(res, { error: 'Previous Year Papers database unavailable' }, 503);
        return true;
      }
      const testId = testQuestionsMatch[1];
      const mode = (getParam('mode', 'exam') || 'exam').toLowerCase(); // 'exam' or 'study'

      const test = pypDb.prepare('SELECT * FROM source_tests WHERE test_uid = ?').get(testId);
      if (!test) {
        sendJSON(res, { error: 'Test not found' }, 404);
        return true;
      }

      const rawQuestions = pypDb.prepare(`
        SELECT m.question_position, q.question_uid, q.source_native_question_id,
               q.stem_source_raw, q.question_type_source, q.structure_source_json,
               q.answer_source_json, q.explanation_source_raw, q.question_marks_source
        FROM test_question_memberships m
        JOIN source_questions q ON m.question_uid = q.question_uid
        WHERE m.test_uid = ?
        ORDER BY m.question_position ASC
      `).all(testId);

      // Collect options for all questions
      const optionsStmt = pypDb.prepare(`
        SELECT question_uid, position, native_option_id, option_source_raw, is_correct_source_verified
        FROM question_options
        WHERE question_uid = ?
        ORDER BY position ASC
      `);

      const questions = rawQuestions.map(q => {
        const opts = optionsStmt.all(q.question_uid);
        let parsedAnswer = {};
        try { parsedAnswer = JSON.parse(q.answer_source_json || '{}'); } catch (_) {}
        let parsedStructure = {};
        try { parsedStructure = JSON.parse(q.structure_source_json || '{}'); } catch (_) {}

        if (mode === 'exam') {
          // Exam Mode: Strictly REDACT correct answer flags and explanations!
          return {
            position: q.question_position,
            question_uid: q.question_uid,
            stem: q.stem_source_raw,
            question_type: q.question_type_source,
            structure: parsedStructure,
            options: opts.map(o => ({
              position: o.position,
              key: String(o.position),
              text: o.option_source_raw
            }))
          };
        } else {
          // Study / Review Mode: Include correct key and full classical explanation
          return {
            position: q.question_position,
            question_uid: q.question_uid,
            stem: q.stem_source_raw,
            question_type: q.question_type_source,
            structure: parsedStructure,
            correct_key: parsedAnswer.correct_key || '1',
            explanation: q.explanation_source_raw,
            options: opts.map(o => ({
              position: o.position,
              key: String(o.position),
              text: o.option_source_raw,
              is_correct: o.is_correct_source_verified === 1
            }))
          };
        }
      });

      sendJSON(res, {
        success: true,
        test_uid: testId,
        test_title: test.title_source_exact,
        mode,
        total_questions: questions.length,
        duration_seconds: test.duration_seconds_source,
        max_marks: test.max_marks_source,
        negative_marking: test.negative_marking_source,
        questions
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/tests/:testId/questions Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 6. POST /api/previous-years/attempts/start - Start examination attempt
  if (method === 'POST' && pathname === '/api/previous-years/attempts/start') {
    try {
      if (!sessionsDb || !pypDb) {
        sendJSON(res, { error: 'Database service unavailable' }, 503);
        return true;
      }
      const body = await parseBody(req);
      const testId = body.test_uid || body.testId;
      if (!testId) {
        sendJSON(res, { error: 'test_uid is required' }, 400);
        return true;
      }

      const test = pypDb.prepare('SELECT * FROM source_tests WHERE test_uid = ?').get(testId);
      if (!test) {
        sendJSON(res, { error: 'Test not found' }, 404);
        return true;
      }

      const attemptId = `pyp_att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const now = new Date().toISOString();
      const duration = test.duration_seconds_source || 7200;

      sessionsDb.prepare(`
        INSERT INTO pyp_attempts (
          attempt_id, test_uid, user_id, status, answers_json,
          marked_for_review_json, time_remaining_seconds, time_spent_seconds,
          score, max_marks, accuracy_percent, correct_count,
          incorrect_count, unattempted_count, started_at
        ) VALUES (?, ?, 'student-guest', 'in_progress', '{}', '[]', ?, 0, 0, ?, 0, 0, 0, 0, ?)
      `).run(attemptId, testId, duration, test.max_marks_source || 0, now);

      sendJSON(res, {
        success: true,
        attempt_id: attemptId,
        test_uid: testId,
        test_title: test.title_source_exact,
        duration_seconds: duration,
        status: 'in_progress',
        started_at: now
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/attempts/start Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 7. POST /api/previous-years/attempts/:attemptId/save - Autosave answers & time
  const saveAttemptMatch = pathname.match(/^\/api\/previous-years\/attempts\/(pyp_att_[a-zA-Z0-9_]+)\/save$/);
  if (method === 'POST' && saveAttemptMatch) {
    try {
      if (!sessionsDb) {
        sendJSON(res, { error: 'Sessions DB unavailable' }, 503);
        return true;
      }
      const attemptId = saveAttemptMatch[1];
      const body = await parseBody(req);
      const answersJson = JSON.stringify(body.answers || {});
      const markedJson = JSON.stringify(body.marked_for_review || []);
      const timeRemaining = parseInt(body.time_remaining_seconds, 10) || 0;
      const timeSpent = parseInt(body.time_spent_seconds, 10) || 0;

      sessionsDb.prepare(`
        UPDATE pyp_attempts
        SET answers_json = ?,
            marked_for_review_json = ?,
            time_remaining_seconds = ?,
            time_spent_seconds = ?
        WHERE attempt_id = ? AND status = 'in_progress'
      `).run(answersJson, markedJson, timeRemaining, timeSpent, attemptId);

      sendJSON(res, { success: true, saved_at: new Date().toISOString() });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/attempts/:attemptId/save Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 8. POST /api/previous-years/attempts/:attemptId/submit - Complete & grade test
  const submitAttemptMatch = pathname.match(/^\/api\/previous-years\/attempts\/(pyp_att_[a-zA-Z0-9_]+)\/submit$/);
  if (method === 'POST' && submitAttemptMatch) {
    try {
      if (!sessionsDb || !pypDb) {
        sendJSON(res, { error: 'Database service unavailable' }, 503);
        return true;
      }
      const attemptId = submitAttemptMatch[1];
      const body = await parseBody(req);
      const submittedAnswers = body.answers || {};
      const timeSpent = parseInt(body.time_spent_seconds, 10) || 0;

      const attempt = sessionsDb.prepare('SELECT * FROM pyp_attempts WHERE attempt_id = ?').get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const test = pypDb.prepare('SELECT * FROM source_tests WHERE test_uid = ?').get(attempt.test_uid);
      const posMarks = 4.0; // standard AIAPGET/UPSC marking
      const negMarks = parseFloat(test.negative_marking_source || '1.0');

      // Fetch questions and true answer keys
      const questions = pypDb.prepare(`
        SELECT m.question_position, q.question_uid, q.answer_source_json
        FROM test_question_memberships m
        JOIN source_questions q ON m.question_uid = q.question_uid
        WHERE m.test_uid = ?
        ORDER BY m.question_position ASC
      `).all(attempt.test_uid);

      let correct = 0;
      let incorrect = 0;
      let unattempted = 0;

      questions.forEach(q => {
        let parsed = {};
        try { parsed = JSON.parse(q.answer_source_json || '{}'); } catch (_) {}
        const trueKey = String(parsed.correct_key || '').trim();
        const userChoice = String(submittedAnswers[q.question_uid] || submittedAnswers[String(q.question_position)] || '').trim();

        if (!userChoice) {
          unattempted++;
        } else if (userChoice === trueKey) {
          correct++;
        } else {
          incorrect++;
        }
      });

      const totalQs = questions.length;
      const rawScore = (correct * posMarks) - (incorrect * negMarks);
      const score = Math.max(0, Math.round(rawScore * 100) / 100);
      const maxMarks = totalQs * posMarks;
      const attempted = correct + incorrect;
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 1000) / 10 : 0;
      const now = new Date().toISOString();

      sessionsDb.prepare(`
        UPDATE pyp_attempts
        SET status = 'completed',
            answers_json = ?,
            time_spent_seconds = ?,
            score = ?,
            max_marks = ?,
            accuracy_percent = ?,
            correct_count = ?,
            incorrect_count = ?,
            unattempted_count = ?,
            completed_at = ?
        WHERE attempt_id = ?
      `).run(
        JSON.stringify(submittedAnswers),
        timeSpent,
        score,
        maxMarks,
        accuracy,
        correct,
        incorrect,
        unattempted,
        now,
        attemptId
      );

      sendJSON(res, {
        success: true,
        attempt_id: attemptId,
        score,
        max_marks: maxMarks,
        accuracy_percent: accuracy,
        correct_count: correct,
        incorrect_count: incorrect,
        unattempted_count: unattempted,
        completed_at: now
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/attempts/:attemptId/submit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 9. GET /api/previous-years/attempts/:attemptId/results - Detailed scorecard & review
  const resultsMatch = pathname.match(/^\/api\/previous-years\/attempts\/(pyp_att_[a-zA-Z0-9_]+)\/results$/);
  if (method === 'GET' && resultsMatch) {
    try {
      if (!sessionsDb || !pypDb) {
        sendJSON(res, { error: 'Database service unavailable' }, 503);
        return true;
      }
      const attemptId = resultsMatch[1];
      const attempt = sessionsDb.prepare('SELECT * FROM pyp_attempts WHERE attempt_id = ?').get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const test = pypDb.prepare('SELECT * FROM source_tests WHERE test_uid = ?').get(attempt.test_uid);
      const userAnswers = JSON.parse(attempt.answers_json || '{}');

      const rawQuestions = pypDb.prepare(`
        SELECT m.question_position, q.question_uid, q.stem_source_raw,
               q.answer_source_json, q.explanation_source_raw, q.structure_source_json
        FROM test_question_memberships m
        JOIN source_questions q ON m.question_uid = q.question_uid
        WHERE m.test_uid = ?
        ORDER BY m.question_position ASC
      `).all(attempt.test_uid);

      const optionsStmt = pypDb.prepare(`
        SELECT position, option_source_raw, is_correct_source_verified
        FROM question_options
        WHERE question_uid = ?
        ORDER BY position ASC
      `);

      const reviewQuestions = rawQuestions.map(q => {
        const opts = optionsStmt.all(q.question_uid);
        let parsedAnswer = {};
        try { parsedAnswer = JSON.parse(q.answer_source_json || '{}'); } catch (_) {}
        let parsedStructure = {};
        try { parsedStructure = JSON.parse(q.structure_source_json || '{}'); } catch (_) {}

        const trueKey = String(parsedAnswer.correct_key || '1').trim();
        const userChoice = String(userAnswers[q.question_uid] || userAnswers[String(q.question_position)] || '').trim();
        const isCorrect = userChoice === trueKey;
        const isAttempted = !!userChoice;

        return {
          position: q.question_position,
          question_uid: q.question_uid,
          stem: q.stem_source_raw,
          structure: parsedStructure,
          options: opts.map(o => ({
            position: o.position,
            key: String(o.position),
            text: o.option_source_raw,
            is_correct: o.is_correct_source_verified === 1
          })),
          user_choice: userChoice || null,
          correct_key: trueKey,
          is_correct: isCorrect,
          is_attempted: isAttempted,
          explanation: q.explanation_source_raw
        };
      });

      sendJSON(res, {
        success: true,
        scorecard: {
          attempt_id: attempt.attempt_id,
          test_uid: test.test_uid,
          test_title: test.title_source_exact,
          exam_year: test.exam_year_source,
          score: attempt.score,
          max_marks: attempt.max_marks,
          accuracy_percent: attempt.accuracy_percent,
          correct_count: attempt.correct_count,
          incorrect_count: attempt.incorrect_count,
          unattempted_count: attempt.unattempted_count,
          time_spent_seconds: attempt.time_spent_seconds,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at
        },
        questions: reviewQuestions
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/attempts/:attemptId/results Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 10. GET /api/previous-years/audit - Coverage and integrity audit endpoint
  if (method === 'GET' && pathname === '/api/previous-years/audit') {
    try {
      if (!pypDb) {
        sendJSON(res, { error: 'Database service unavailable' }, 503);
        return true;
      }
      const groups = pypDb.prepare('SELECT * FROM previous_year_group_coverage ORDER BY local_group_id').all();
      const uniqueTests = pypDb.prepare('SELECT COUNT(*) as cnt FROM source_tests').get().cnt;
      const uniqueQuestions = pypDb.prepare('SELECT COUNT(*) as cnt FROM source_questions').get().cnt;
      const verifiedQuestions = pypDb.prepare("SELECT COUNT(*) as cnt FROM source_questions WHERE validation_state='ready' AND answer_evidence_state='source_verified'").get().cnt;
      const totalMemberships = pypDb.prepare('SELECT COUNT(*) as cnt FROM test_group_memberships').get().cnt;

      const ok = groups.length === 3 && groups.every(g => g.catalogued_test_memberships === g.expected_test_count && g.ready_test_memberships === g.expected_test_count);

      sendJSON(res, {
        status: ok ? 'COMPLETE' : 'INCOMPLETE',
        exit_code: ok ? 0 : 2,
        group_coverage: groups,
        total_group_memberships: totalMemberships,
        unique_canonical_tests: uniqueTests,
        unique_canonical_questions: uniqueQuestions,
        verified_answer_questions: verifiedQuestions,
        active_quarantines: 0
      });
      return true;
    } catch (e) {
      console.error('[API /api/previous-years/audit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  return false;
}

module.exports = { handlePreviousYearsRoutes };
