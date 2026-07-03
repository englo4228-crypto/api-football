import { Router } from 'express';
import { db } from '../store/db';
import { ApiError } from '../middleware/errorHandler';

export const coachesRouter = Router();

/** Coach Profiles: managerial records and stint-by-stint history. */
coachesRouter.get('/:id', (req, res) => {
  const coach = db.coaches.get(req.params.id);
  if (!coach) throw new ApiError(404, 'Coach not found');
  res.json({
    ...coach,
    currentTeam: coach.currentTeamId ? db.teams.get(coach.currentTeamId)?.name.en ?? null : null,
    careerHistory: coach.careerHistory.map((stint) => ({
      ...stint,
      team: db.teams.get(stint.teamId)?.name.en ?? null,
      winPct: stint.matches > 0 ? Math.round((stint.wins / stint.matches) * 1000) / 10 : 0,
    })),
  });
});
