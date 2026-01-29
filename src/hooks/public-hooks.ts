import {
    contactUsPublicContactPost,
    healthcheckPublicHealthcheckGet,
    type ContactForm,
} from '@/openapi'
import { useMutation, useQuery } from '@tanstack/react-query'

// ============================================================================
// PUBLIC HOOKS
// ============================================================================

// Healthcheck Query
export const useHealthcheckQuery = () => {
    return useQuery({
        queryKey: ['healthcheck'],
        queryFn: () => healthcheckPublicHealthcheckGet(),
    })
}

// Contact Us Mutation
export const useContactUsMutation = () => {
    return useMutation({
        mutationFn: (contactForm: ContactForm) =>
            contactUsPublicContactPost(contactForm),
    })
}
