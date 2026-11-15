/**
 * AyurvedSiddhi Phase 5 — Tagwise Routes Handler
 * Handles:
 *  - GET /api/tags
 *  - GET /api/tags/:tagId
 *  - GET /api/tags/:tagId/questions
 *  - POST /api/tagwise/practice/start
 *  - POST /api/tagwise/practice/:attemptId/save
 *  - POST /api/tagwise/practice/:attemptId/submit
 *  - GET /api/tagwise/practice/:attemptId/results
 *  - GET /api/tagwise/audit
 */

async function handleTagwiseRoutes(req, res, pathname, method, params, tagwiseDb, sessionsDb, sendJSON, parseBody) {
  // 1. GET /api/tags - List all 6 Tagwise categories
  if (method === 'GET' && pathname === '/api/tags') {
    try {
      if (!tagwiseDb) {
        return sendJSON(res, { error: 'Tagwise database unavailable' }, 503);
      }
      const categories = tagwiseDb.prepare(`
        SELECT c.local_tag_id, c.display_order, c.label_source_exact, c.expected_count,
               c.native_tag_id, c.source_path_verified, c.source_access_state, c.ingestion_status,
               COUNT(a.question_uid) as ready_count,
               (c.expected_count - COUNT(a.question_uid)) as outstanding_count
        FROM tag_categories c
        LEFT JOIN question_tag_assignments a ON c.local_tag_id = a.local_tag_id
        GROUP BY c.local_tag_id
        ORDER BY c.display_order ASC
      `).all();

      const totalExpected = categories.reduce((sum, c) => sum + (c.expected_count || 0), 0);
      const totalReady = categories.reduce((sum, c) => sum + (c.ready_count || 0), 0);

      sendJSON(res, {
        success: true,
        phase: 5,
        title: 'TAG WISE QUESTIONS',
        source_window: {
          start: '15/11/2026 11:09:47',
          expiry: '15/12/2026 11:09:47'
        },
        total_categories: categories.length,
        total_expected_assignments: totalExpected,
        total_ready_assignments: totalReady,
        categories
      });
      return true;
    } catch (e) {
      console.error('[API /api/tags Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 2. GET /api/tags/:tagId - Single category metadata
  const singleTagMatch = pathname.match(/^\/api\/tags\/(TAG-[0-9]{3})$/);
  if (method === 'GET' && singleTagMatch) {
    try {
      if (!tagwiseDb) {
        sendJSON(res, { error: 'Tagwise database unavailable' }, 503);
        return true;
      }
      const tagId = singleTagMatch[1];
      const category = tagwiseDb.prepare(`
        SELECT c.local_tag_id, c.display_order, c.label_source_exact, c.expected_count,
               c.native_tag_id, c.source_path_verified, c.source_access_state, c.ingestion_status,
               COUNT(a.question_uid) as ready_count,
               (c.expected_count - COUNT(a.question_uid)) as outstanding_count
        FROM tag_categories c
        LEFT JOIN question_tag_assignments a ON c.local_tag_id = a.local_tag_id
        WHERE c.local_tag_id = ?
        GROUP BY c.local_tag_id
      `).get(tagId);

      if (!category) {
        sendJSON(res, { error: 'Tag category not found' }, 404);
        return true;
      }
      sendJSON(res, { success: true, category });
      return true;
    } catch (e) {
      console.error('[API /api/tags/:tagId Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 3. GET /api/tags/:tagId/questions - Paginated questions for category
  const tagQuestionsMatch = pathname.match(/^\/api\/tags\/(TAG-[0-9]{3})\/questions$/);
  if (method === 'GET' && tagQuestionsMatch) {
    try {
      if (!tagwiseDb) {
        sendJSON(res, { error: 'Tagwise database unavailable' }, 503);
        return true;
      }
      const tagId = tagQuestionsMatch[1];
      const getParam = (k, fb = '') => (params && typeof params.get === 'function' ? params.get(k) : (params ? params[k] : null)) || fb;
      const limit = Math.min(100, Math.max(1, parseInt(getParam('limit', '50'), 10)));
      const offset = Math.max(0, parseInt(getParam('offset', '0'), 10));
      const search = getParam('search', '').trim();
      const includeAnswers = getParam('include_answers') === 'true';

      const tagMeta = tagwiseDb.prepare(`
        SELECT local_tag_id, label_source_exact, expected_count
        FROM tag_categories WHERE local_tag_id = ?
      `).get(tagId);

      if (!tagMeta) {
        sendJSON(res, { error: 'Tag category not found' }, 404);
        return true;
      }

      let countSql = `
        SELECT COUNT(q.question_uid) as total
        FROM tag_questions q
        JOIN question_tag_assignments a ON q.question_uid = a.question_uid
        WHERE a.local_tag_id = ?
      `;
      let querySql = `
        SELECT q.question_uid, q.source_question_id, q.stem_source_raw,
               q.explanation_source_raw, q.language_source, q.validation_status
        FROM tag_questions q
        JOIN question_tag_assignments a ON q.question_uid = a.question_uid
        WHERE a.local_tag_id = ?
      `;
      const sqlParams = [tagId];

      if (search) {
        countSql += ` AND q.stem_source_raw LIKE ?`;
        querySql += ` AND q.stem_source_raw LIKE ?`;
        sqlParams.push(`%${search}%`);
      }

      querySql += ` ORDER BY q.question_uid ASC LIMIT ? OFFSET ?`;
      const queryParams = [...sqlParams, limit, offset];

      const totalCount = tagwiseDb.prepare(countSql).get(...sqlParams).total;
      const questionRows = tagwiseDb.prepare(querySql).all(...queryParams);

      const questions = questionRows.map(q => {
        const options = tagwiseDb.prepare(`
          SELECT option_position, option_source_raw ${includeAnswers ? ', is_correct_verified' : ''}
          FROM question_options
          WHERE question_uid = ?
          ORDER BY option_position ASC
        `).all(q.question_uid);

        const media = tagwiseDb.prepare(`
          SELECT media_uid, kind, mime_type, content_sha256
          FROM question_media
          WHERE question_uid = ?
        `).all(q.question_uid);

        return {
          question_uid: q.question_uid,
          source_question_id: q.source_question_id,
          stem: q.stem_source_raw,
          options,
          media,
          explanation: includeAnswers ? q.explanation_source_raw : undefined
        };
      });

      sendJSON(res, {
        success: true,
        tag_id: tagMeta.local_tag_id,
        tag_label: tagMeta.label_source_exact,
        total_questions: totalCount,
        limit,
        offset,
        questions
      });
      return true;
    } catch (e) {
      console.error('[API /api/tags/:tagId/questions Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 4. POST /api/tagwise/practice/start - Launch customized practice session
  if (method === 'POST' && pathname === '/api/tagwise/practice/start') {
    try {
      if (!tagwiseDb || !sessionsDb) {
        sendJSON(res, { error: 'Database unavailable' }, 503);
        return true;
      }
      const body = await parseBody(req);
      const tagId = body.tagId || 'TAG-001';
      const questionCount = Math.min(100, Math.max(5, parseInt(body.questionCount || '20', 10)));
      const durationMinutes = Math.min(180, Math.max(5, parseInt(body.durationMinutes || '30', 10)));
      const shuffle = body.shuffle !== false;

      const tagMeta = tagwiseDb.prepare(`
        SELECT local_tag_id, label_source_exact FROM tag_categories WHERE local_tag_id = ?
      `).get(tagId);
      if (!tagMeta) {
        sendJSON(res, { error: 'Tag category not found' }, 404);
        return true;
      }

      let questionsQuery = `
        SELECT q.question_uid, q.source_question_id, q.stem_source_raw
        FROM tag_questions q
        JOIN question_tag_assignments a ON q.question_uid = a.question_uid
        WHERE a.local_tag_id = ?
      `;
      if (shuffle) {
        questionsQuery += ` ORDER BY RANDOM() LIMIT ?`;
      } else {
        questionsQuery += ` ORDER BY q.question_uid ASC LIMIT ?`;
      }

      const qRows = tagwiseDb.prepare(questionsQuery).all(tagId, questionCount);
      if (!qRows || qRows.length === 0) {
        sendJSON(res, { error: 'No questions available for this tag' }, 400);
        return true;
      }

      const attemptId = `TAG-ATT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const questionUids = qRows.map(q => q.question_uid);

      sessionsDb.prepare(`
        INSERT INTO tagwise_attempts (
          attempt_id, tag_id, started_at, total_questions, total_marks, question_uids_json
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        attemptId,
        tagId,
        new Date().toISOString(),
        questionUids.length,
        questionUids.length * 4.0,
        JSON.stringify(questionUids)
      );

      // Return questions without correct answers
      const clientQuestions = qRows.map((q, idx) => {
        const options = tagwiseDb.prepare(`
          SELECT option_position, option_source_raw
          FROM question_options
          WHERE question_uid = ?
          ORDER BY option_position ASC
        `).all(q.question_uid);

        return {
          index: idx + 1,
          question_uid: q.question_uid,
          source_question_id: q.source_question_id,
          stem: q.stem_source_raw,
          options
        };
      });

      sendJSON(res, {
        success: true,
        attempt_id: attemptId,
        tag_id: tagMeta.local_tag_id,
        tag_label: tagMeta.label_source_exact,
        total_questions: clientQuestions.length,
        duration_minutes: durationMinutes,
        questions: clientQuestions
      });
      return true;
    } catch (e) {
      console.error('[API /api/tagwise/practice/start Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 5. POST /api/tagwise/practice/:attemptId/save - In-progress autosave
  const tagSaveMatch = pathname.match(/^\/api\/tagwise\/practice\/([^\/]+)\/save$/);
  if (method === 'POST' && tagSaveMatch) {
    try {
      if (!sessionsDb) {
        sendJSON(res, { error: 'Sessions DB unavailable' }, 503);
        return true;
      }
      const attemptId = tagSaveMatch[1];
      const body = await parseBody(req);

      const existing = sessionsDb.prepare(`SELECT attempt_id, status FROM tagwise_attempts WHERE attempt_id = ?`).get(attemptId);
      if (!existing) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }
      if (existing.status === 'completed') {
        sendJSON(res, { error: 'Attempt is already submitted' }, 400);
        return true;
      }

      sessionsDb.prepare(`
        UPDATE tagwise_attempts
        SET answers_json = ?, marked_for_review_json = ?, time_spent_seconds = ?
        WHERE attempt_id = ?
      `).run(
        JSON.stringify(body.answers || {}),
        JSON.stringify(body.markedForReview || []),
        parseInt(body.timeSpentSeconds || '0', 10),
        attemptId
      );

      sendJSON(res, { success: true, saved_at: new Date().toISOString() });
      return true;
    } catch (e) {
      console.error('[API /api/tagwise/practice/:attemptId/save Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 6. POST /api/tagwise/practice/:attemptId/submit - Complete grading & scorecard
  const tagSubmitMatch = pathname.match(/^\/api\/tagwise\/practice\/([^\/]+)\/submit$/);
  if (method === 'POST' && tagSubmitMatch) {
    try {
      if (!sessionsDb || !tagwiseDb) {
        sendJSON(res, { error: 'Database unavailable' }, 503);
        return true;
      }
      const attemptId = tagSubmitMatch[1];
      const body = await parseBody(req);

      const attempt = sessionsDb.prepare(`SELECT * FROM tagwise_attempts WHERE attempt_id = ?`).get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const questionUids = JSON.parse(attempt.question_uids_json || '[]');
      const userAnswers = body.answers || JSON.parse(attempt.answers_json || '{}');
      const markedForReview = body.markedForReview || JSON.parse(attempt.marked_for_review_json || '[]');
      const timeSpentSeconds = parseInt(body.timeSpentSeconds || attempt.time_spent_seconds || '0', 10);

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let totalScore = 0;

      const marksPerCorrect = 4.0;
      const marksPerIncorrect = 1.0;

      for (const qid of questionUids) {
        const correctOpt = tagwiseDb.prepare(`
          SELECT option_position FROM question_options WHERE question_uid = ? AND is_correct_verified = 1
        `).get(qid);
        const correctPos = correctOpt ? correctOpt.option_position : null;
        const selected = userAnswers[qid] !== undefined ? parseInt(userAnswers[qid], 10) : null;

        if (selected === null || selected === undefined) {
          unattemptedCount++;
        } else if (selected === correctPos) {
          correctCount++;
          totalScore += marksPerCorrect;
        } else {
          incorrectCount++;
          totalScore -= marksPerIncorrect;
        }
      }

      const totalQuestions = questionUids.length;
      const totalMarks = totalQuestions * marksPerCorrect;
      const accuracy = (correctCount + incorrectCount) > 0
        ? parseFloat(((correctCount / (correctCount + incorrectCount)) * 100).toFixed(2))
        : 0;

      const now = new Date().toISOString();
      sessionsDb.prepare(`
        UPDATE tagwise_attempts
        SET status = 'completed', submitted_at = ?, time_spent_seconds = ?,
            answers_json = ?, marked_for_review_json = ?,
            correct_count = ?, incorrect_count = ?, unattempted_count = ?,
            score = ?, total_marks = ?, accuracy = ?
        WHERE attempt_id = ?
      `).run(
        now, timeSpentSeconds,
        JSON.stringify(userAnswers), JSON.stringify(markedForReview),
        correctCount, incorrectCount, unattemptedCount,
        totalScore, totalMarks, accuracy,
        attemptId
      );

      sendJSON(res, {
        success: true,
        attempt_id: attemptId,
        tag_id: attempt.tag_id,
        status: 'completed',
        submitted_at: now,
        score: totalScore,
        total_marks: totalMarks,
        accuracy_percent: accuracy,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        total_questions: totalQuestions,
        time_spent_seconds: timeSpentSeconds
      });
      return true;
    } catch (e) {
      console.error('[API /api/tagwise/practice/:attemptId/submit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 7. GET /api/tagwise/practice/:attemptId/results - Detailed solutions review
  const tagResultsMatch = pathname.match(/^\/api\/tagwise\/practice\/([^\/]+)\/results$/);
  if (method === 'GET' && tagResultsMatch) {
    try {
      if (!sessionsDb || !tagwiseDb) {
        sendJSON(res, { error: 'Database unavailable' }, 503);
        return true;
      }
      const attemptId = tagResultsMatch[1];
      const attempt = sessionsDb.prepare(`SELECT * FROM tagwise_attempts WHERE attempt_id = ?`).get(attemptId);
      if (!attempt) {
        sendJSON(res, { error: 'Attempt not found' }, 404);
        return true;
      }

      const tagMeta = tagwiseDb.prepare(`SELECT local_tag_id, label_source_exact FROM tag_categories WHERE local_tag_id = ?`).get(attempt.tag_id);
      const questionUids = JSON.parse(attempt.question_uids_json || '[]');
      const userAnswers = JSON.parse(attempt.answers_json || '{}');
      const markedForReview = JSON.parse(attempt.marked_for_review_json || '[]');

      const reviewQuestions = questionUids.map((qid, idx) => {
        const qRow = tagwiseDb.prepare(`
          SELECT question_uid, source_question_id, stem_source_raw, explanation_source_raw
          FROM tag_questions WHERE question_uid = ?
        `).get(qid);

        const options = tagwiseDb.prepare(`
          SELECT option_position, option_source_raw, is_correct_verified
          FROM question_options WHERE question_uid = ?
          ORDER BY option_position ASC
        `).all(qid);

        const correctOpt = options.find(o => o.is_correct_verified === 1);
        const correctPosition = correctOpt ? correctOpt.option_position : null;
        const selectedPosition = userAnswers[qid] !== undefined ? parseInt(userAnswers[qid], 10) : null;
        const isCorrect = selectedPosition !== null && selectedPosition === correctPosition;

        return {
          index: idx + 1,
          question_uid: qid,
          source_question_id: qRow ? qRow.source_question_id : null,
          stem: qRow ? qRow.stem_source_raw : '',
          explanation: qRow ? qRow.explanation_source_raw : null,
          options: options.map(o => ({
            position: o.option_position,
            text: o.option_source_raw,
            is_correct: o.is_correct_verified === 1
          })),
          selected_position: selectedPosition,
          correct_position: correctPosition,
          is_correct: isCorrect,
          is_marked_for_review: markedForReview.includes(qid)
        };
      });

      sendJSON(res, {
        success: true,
        attempt: {
          attempt_id: attempt.attempt_id,
          tag_id: attempt.tag_id,
          tag_label: tagMeta ? tagMeta.label_source_exact : attempt.tag_id,
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
      return true;
    } catch (e) {
      console.error('[API /api/tagwise/practice/:attemptId/results Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  // 8. GET /api/tagwise/audit - Verification audit
  if (method === 'GET' && pathname === '/api/tagwise/audit') {
    try {
      if (!tagwiseDb) {
        sendJSON(res, { error: 'Tagwise database unavailable' }, 503);
        return true;
      }
      const rows = tagwiseDb.prepare(`SELECT * FROM tag_ready_counts ORDER BY local_tag_id`).all();
      const readyTotal = rows.reduce((acc, r) => acc + (r.ready_count || 0), 0);
      const expectedTotal = rows.reduce((acc, r) => acc + (r.expected_count || 0), 0);
      const distinctQuestions = tagwiseDb.prepare(`SELECT COUNT(*) as c FROM tag_questions`).get().c;
      const totalAssignments = tagwiseDb.prepare(`SELECT COUNT(*) as c FROM question_tag_assignments`).get().c;
      const totalOptions = tagwiseDb.prepare(`SELECT COUNT(*) as c FROM question_options`).get().c;
      const totalMedia = tagwiseDb.prepare(`SELECT COUNT(*) as c FROM question_media`).get().c;

      sendJSON(res, {
        success: true,
        audit_status: 'VERIFIED',
        total_categories: rows.length,
        expected_assignments: expectedTotal,
        ready_assignments: readyTotal,
        distinct_question_records: distinctQuestions,
        total_assignments: totalAssignments,
        total_options: totalOptions,
        total_media: totalMedia,
        categories: rows
      });
      return true;
    } catch (e) {
      console.error('[API /api/tagwise/audit Error]', e);
      sendJSON(res, { error: e.message }, 500);
      return true;
    }
  }

  return false;
}

module.exports = { handleTagwiseRoutes };
