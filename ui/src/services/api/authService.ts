import { apiClient } from "./axiosConfig";

export interface LoginBody { email: string; password: string }
export interface RegisterBody extends LoginBody { username: string }
export interface AuthResponse { token: string }

export const authService = {
    login: async (data: LoginBody) => {
        const response = await apiClient.post<AuthResponse>("/auth/login", data);
        return response.data;
    },
    register: async (data: RegisterBody) => {
        const response = await apiClient.post<AuthResponse>("/auth/register", data);
        return response.data;
    },
};