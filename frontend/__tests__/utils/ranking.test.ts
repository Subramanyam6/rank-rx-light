// Tests for the ranking calculation logic
describe('Ranking Calculations', () => {
  // Mock the synthetic applicants data
  const mockSyntheticData = [
    {
      file: 'synthetic1.pdf',
      visa: {
        authorized_to_work_us: 'Yes',
        current_work_authorization: 'H1B',
        visa_sponsorship_needed: 'No',
        visa_sponsorship_sought: null,
      },
      usmle: {
        step1: {
          present: true,
          passed: true,
          pass_date: '01/15/2023',
          score: '240',
          failures: 0,
        },
        step2_ck: {
          present: true,
          passed: true,
          pass_date: '03/20/2023',
          score: '250',
          failures: 0,
        },
      },
      ecfmg_status_report: {
        present: true,
        certified: 'Yes',
      },
    },
    {
      file: 'synthetic2.pdf',
      visa: {
        authorized_to_work_us: 'No',
        current_work_authorization: null,
        visa_sponsorship_needed: 'Yes',
        visa_sponsorship_sought: 'H1B',
      },
      usmle: {
        step1: {
          present: true,
          passed: true,
          pass_date: '02/10/2023',
          score: '230',
          failures: 1,
        },
        step2_ck: {
          present: true,
          passed: false,
          pass_date: null,
          score: null,
          failures: 2,
        },
      },
      ecfmg_status_report: {
        present: false,
        certified: 'Not Available',
      },
    },
  ];

  test('calculates score correctly for high-performing applicant', () => {
    const applicant = mockSyntheticData[0];

    // Expected score calculation based on the algorithm:
    // s1_pass = 1.0, s2_pass = 1.0, s2_score = 250, s2_comp = max(0, min(1, (250-180)/100)) = 0.7
    // failures = 0, visa_needed = 0, ecfmg_yes = 1
    // score = 0.55 * 0.7 + 0.25 * 1.0 + 0.10 * max(0, 1-0/3) + 0.05 * (1-0) + 0.05 * 1
    // score = 0.385 + 0.25 + 0.10 + 0.05 + 0.05 = 0.835

    const expectedScore = 0.835;
    const calculatedScore = calculateScore(applicant);

    expect(calculatedScore).toBeCloseTo(expectedScore, 3);
  });

  test('calculates score correctly for lower-performing applicant', () => {
    const applicant = mockSyntheticData[1];

    // s1_pass = 1.0, s2_pass = 0.0, s2_score = null, s2_comp = 0.0 * 0.7 = 0.0
    // failures = 3, visa_needed = 1, ecfmg_yes = 0
    // score = 0.55 * 0.0 + 0.25 * 1.0 + 0.10 * max(0, 1-3/3) + 0.05 * (1-1) + 0.05 * 0
    // score = 0.0 + 0.25 + 0.0 + 0.0 + 0.0 = 0.25

    const expectedScore = 0.25;
    const calculatedScore = calculateScore(applicant);

    expect(calculatedScore).toBeCloseTo(expectedScore, 3);
  });

  test('handles missing scores correctly', () => {
    const applicantWithoutScores = {
      ...mockSyntheticData[0],
      usmle: {
        ...mockSyntheticData[0].usmle,
        step2_ck: {
          ...mockSyntheticData[0].usmle.step2_ck,
          score: null,
        },
      },
    };

    const score = calculateScore(applicantWithoutScores);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('handles failed exams correctly', () => {
    const applicantWithFailures = {
      ...mockSyntheticData[0],
      usmle: {
        ...mockSyntheticData[0].usmle,
        step1: {
          ...mockSyntheticData[0].usmle.step1,
          failures: 2,
        },
        step2_ck: {
          ...mockSyntheticData[0].usmle.step2_ck,
          failures: 1,
        },
      },
    };

    const score = calculateScore(applicantWithFailures);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('calculates ranking position correctly', async () => {
    const testApplicant = mockSyntheticData[0];
    const allScores = mockSyntheticData.map(app => ({
      score: calculateScore(app),
      isUploaded: false,
    }));

    allScores.push({
      score: calculateScore(testApplicant),
      isUploaded: true,
    });

    // Sort by score (higher is better)
    allScores.sort((a, b) => b.score - a.score);

    const uploadedPosition = allScores.findIndex(app => app.isUploaded) + 1;
    const totalCandidates = allScores.length;
    const percentile = Math.round(((totalCandidates - uploadedPosition) / totalCandidates) * 100);

    expect(uploadedPosition).toBeGreaterThan(0);
    expect(uploadedPosition).toBeLessThanOrEqual(totalCandidates);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(100);
  });

  test('handles edge cases in score calculation', () => {
    // Test with all zeros
    const zeroApplicant = {
      file: 'zero.pdf',
      visa: {
        authorized_to_work_us: null,
        current_work_authorization: null,
        visa_sponsorship_needed: 'Yes',
        visa_sponsorship_sought: null,
      },
      usmle: {
        step1: {
          present: false,
          passed: false,
          pass_date: null,
          score: null,
          failures: 3,
        },
        step2_ck: {
          present: false,
          passed: false,
          pass_date: null,
          score: null,
          failures: 3,
        },
      },
      ecfmg_status_report: {
        present: false,
        certified: 'No',
      },
    };

    const score = calculateScore(zeroApplicant);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// Helper function to calculate score (extracted from the main component)
function calculateScore(app: any): number {
  const s1 = app.usmle.step1;
  const s2 = app.usmle.step2_ck;
  const ecfmg = app.ecfmg_status_report;

  const s1_pass = s1.passed ? 1.0 : 0.0;
  const s2_pass = s2.passed ? 1.0 : 0.0;
  const s2_score = s2.score ? parseFloat(s2.score) : null;
  const s2_comp = s2_score ? Math.max(0.0, Math.min(1.0, (s2_score - 180) / 100)) : s2_pass * 0.7;

  const failures = s1.failures + s2.failures;
  const visa_needed = app.visa.visa_sponsorship_needed === 'Yes' ? 1 : 0;
  const ecfmg_yes = ecfmg.certified === 'Yes' ? 1 : 0;

  const score = (
    0.55 * s2_comp +
    0.25 * s1_pass +
    0.10 * Math.max(0, 1 - Math.min(failures, 3) / 3) +
    0.05 * (1 - visa_needed) +
    0.05 * ecfmg_yes
  );

  return Math.round(score * 10000) / 10000;
}
