import AuthLayout from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetMeQuery, useRegisterMutation } from '@/hooks/auth-hooks'
import useAuthStore from '@/stores/useAuthStore'
import { useEffect, useState, type FC } from 'react'
import { useNavigate } from 'react-router'

const RegisterPage: FC = () => {
    const navigate = useNavigate()
    const { setIsLoggedIn } = useAuthStore()
    const [error, setError] = useState<string | null>(null)

    // React Query hooks
    const meQuery = useGetMeQuery()
    const registerMutation = useRegisterMutation()

    // Redirect if already logged in
    useEffect(() => {
        if (meQuery.data?.status === 200) {
            navigate('/spot/BTC-USD')
        }
    }, [meQuery.data, navigate])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirm-password') as string

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        const credentials = {
            username: formData.get('username') as string,
            email: formData.get('email') as string,
            password: password,
        }

        try {
            await registerMutation.mutateAsync(credentials)
            setIsLoggedIn(true)
            navigate('/spot/BTC-USD')
        } catch (err: any) {
            setError(
                err?.body?.error || 'Registration failed. Please try again.'
            )
        }
    }

    return (
        <AuthLayout
            title="Create an Account"
            subtitle="Start your trading journey with us today."
            footerText="Already have an account?"
            footerLinkText="Log In"
            footerTo="/login"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label
                        htmlFor="username"
                        className="text-sm font-medium text-muted-foreground"
                    >
                        Username
                    </label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="yourusername"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="text-sm font-medium text-muted-foreground"
                    >
                        Email
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="text-sm font-medium text-muted-foreground"
                    >
                        Password
                    </label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="*****"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="confirm-password"
                        className="text-sm font-medium text-muted-foreground"
                    >
                        Confirm Password
                    </label>
                    <Input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        placeholder="*****"
                        required
                    />
                </div>

                {error && (
                    <div className="text-center text-red-500 text-sm p-2 bg-red-500/10 rounded-md">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                >
                    {registerMutation.isPending
                        ? 'Creating Account...'
                        : 'Create Account'}
                </Button>
            </form>
        </AuthLayout>
    )
}

export default RegisterPage
