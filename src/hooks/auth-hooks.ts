import {
    changeEmailAuthChangeEmailPost,
    changePasswordAuthChangePasswordPost,
    changeUsernameAuthChangeUsernamePost,
    getMeAuthMeGet,
    getWsTokenAuthWsTokenGet,
    loginAuthLoginPost,
    logoutAuthLogoutPost,
    registerAuthRegisterPost,
    requestEmailVerificationAuthRequestEmailVerificationPost,
    verifyActionAuthVerifyActionPost,
    verifyEmailAuthVerifyEmailPost,
    type UpdateEmail,
    type UpdatePassword,
    type UpdateUsername,
    type UserCreate,
    type UserLogin,
    type VerifyAction,
    type VerifyCode,
} from '@/openapi'
import { useMutation, useQuery } from '@tanstack/react-query'

// ============================================================================
// AUTH HOOKS
// ============================================================================

// Login Mutation
export const useLoginMutation = () => {
    return useMutation({
        mutationFn: (credentials: UserLogin) => loginAuthLoginPost(credentials),
    })
}

// Register Mutation
export const useRegisterMutation = () => {
    return useMutation({
        mutationFn: (userData: UserCreate) =>
            registerAuthRegisterPost(userData),
    })
}

// Request Email Verification Mutation
export const useRequestEmailVerificationMutation = () => {
    return useMutation({
        mutationFn: () =>
            requestEmailVerificationAuthRequestEmailVerificationPost(),
    })
}

// Verify Email Mutation
export const useVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: (verifyCode: VerifyCode) =>
            verifyEmailAuthVerifyEmailPost(verifyCode),
    })
}

// Logout Mutation
export const useLogoutMutation = () => {
    return useMutation({
        mutationFn: () => logoutAuthLogoutPost(),
    })
}

// Get Me Query
export const useGetMeQuery = () => {
    return useQuery({
        queryKey: ['me'],
        queryFn: () => getMeAuthMeGet(),
    })
}

// Get WebSocket Token Query
export const useGetWsTokenQuery = () => {
    return useQuery({
        queryKey: ['wsToken'],
        queryFn: async () => getWsTokenAuthWsTokenGet(),
        staleTime: 0, // Always fetch fresh token
        gcTime: 0, // Don't cache
    })
}

// Change Username Mutation
export const useChangeUsernameMutation = () => {
    return useMutation({
        mutationFn: (updateUsername: UpdateUsername) =>
            changeUsernameAuthChangeUsernamePost(updateUsername),
    })
}

// Change Email Mutation
export const useChangeEmailMutation = () => {
    return useMutation({
        mutationFn: (updateEmail: UpdateEmail) =>
            changeEmailAuthChangeEmailPost(updateEmail),
    })
}

// Change Password Mutation
export const useChangePasswordMutation = () => {
    return useMutation({
        mutationFn: (updatePassword: UpdatePassword) =>
            changePasswordAuthChangePasswordPost(updatePassword),
    })
}

// Verify Action Mutation
export const useVerifyActionMutation = () => {
    return useMutation({
        mutationFn: (verifyAction: VerifyAction) =>
            verifyActionAuthVerifyActionPost(verifyAction),
    })
}
