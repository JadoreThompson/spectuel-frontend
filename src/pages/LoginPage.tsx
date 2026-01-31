import AuthLayout from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetMeQuery, useLoginMutation } from '@/hooks/auth-hooks'
import useAuthStore from '@/stores/useAuthStore'
import { useEffect, useState, type FC } from 'react'
import { Link, useNavigate } from 'react-router'

const LoginPage: FC = () => {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    const setIsLoggedIn = useAuthStore((state) => state.setIsLoggedIn)

    // React Query hooks
    const meQuery = useGetMeQuery()
    const loginMutation = useLoginMutation()

    // Redirect if already logged in
    useEffect(() => {
        if (meQuery.data?.status === 200) {
            setIsLoggedIn(true)
            navigate('/spot/BTC-USD')
        }
    }, [meQuery.data, navigate])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const formData = new FormData(e.currentTarget)
        const credentials = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }

        try {
            await loginMutation.mutateAsync(credentials)
            setIsLoggedIn(true)
            navigate('/spot/BTC-USD')
        } catch (err: any) {
            setError(
                err?.body?.error || 'Invalid credentials. Please try again.'
            )
        }
    }

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Enter your credentials to access your account."
            footerText="Don't have an account?"
            footerLinkText="Sign Up"
            footerTo="/register"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="text-sm font-medium text-muted-foreground"
                    >
                        Email or Username
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
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-muted-foreground"
                        >
                            Password
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        name="password"
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
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? 'Logging in...' : 'Log In'}
                </Button>
            </form>
        </AuthLayout>
    )
}

export default LoginPage
