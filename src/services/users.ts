import { createService } from './serviceFactory';
import { User, UserCreateDTO, UserUpdateDTO } from '../types';

const baseService = createService<User, UserCreateDTO, UserUpdateDTO>('/users');

export const getUsers = baseService.getAll;
export const getUserById = baseService.getById;
export const createUser = baseService.create;
export const updateUser = baseService.update;
export const deleteUser = baseService.delete;
export const deleteMultipleUsers = baseService.deleteMultiple;

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteMultipleUsers
}; 