import { createService } from './serviceFactory';
import type { Database } from '../types';

type Trainer = Database['public']['Tables']['trainers']['Row'];
type TrainerInsert = Database['public']['Tables']['trainers']['Insert'];
type TrainerUpdate = Database['public']['Tables']['trainers']['Update'];

// Creazione del servizio base usando la factory
const baseService = createService<Trainer, TrainerInsert, TrainerUpdate>('/trainers');

// Estensione del servizio con eventuali metodi specifici
const trainerService = baseService.extend({
  // Qui si possono aggiungere metodi specifici se necessario
  getTrainersBySpecialty: async (specialty: string): Promise<Trainer[]> => {
    const trainers = await baseService.getAll();
    return trainers.filter(trainer => 
      trainer.specialties && 
      Array.isArray(trainer.specialties) && 
      trainer.specialties.includes(specialty)
    );
}
});

// Esportazione dei metodi standard
export const getTrainers = trainerService.getAll;
export const getTrainer = trainerService.getById;
export const createTrainer = trainerService.create;
export const updateTrainer = trainerService.update;
export const deleteTrainer = trainerService.delete;
export const getTrainersBySpecialty = trainerService.getTrainersBySpecialty;

// Esportazione del servizio completo come default
export default trainerService;