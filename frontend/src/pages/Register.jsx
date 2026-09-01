import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { registerUser } from '../api/api'


function Register() {

    const navigate = useNavigate()


    const [formData, setFormData] = useState({

        username: '',
        email: '',
        password: '',

    })


    const [message, setMessage] = useState('')


    function handleChange(event) {

        setFormData({

            ...formData,

            [event.target.name]: event.target.value,

        })

    }



    async function handleSubmit(event) {

        event.preventDefault()


        const result = await registerUser(formData)


        if (result.message) {

            setMessage(
                'Account created successfully. Redirecting to login...'
            )


            setTimeout(() => {

                navigate('/login')

            }, 1500)


        } else {

            setMessage(
                'Registration failed. Please check your information.'
            )

        }

    }



    return (

        <main className="min-h-screen bg-[#fdf8f0] flex items-center justify-center px-6">


            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">


                <h1 className="text-3xl font-bold text-gray-900">

                    Create Account

                </h1>


                <p className="mt-2 text-gray-500">

                    Join Khabo-Koi and reserve your favourite restaurants.

                </p>



                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4"
                >


                    <input

                        name="username"

                        value={formData.username}

                        onChange={handleChange}

                        placeholder="Username"

                        className="w-full rounded-xl border px-4 py-3"

                        required

                    />



                    <input

                        name="email"

                        type="email"

                        value={formData.email}

                        onChange={handleChange}

                        placeholder="Email"

                        className="w-full rounded-xl border px-4 py-3"

                        required

                    />



                    <input

                        name="password"

                        type="password"

                        value={formData.password}

                        onChange={handleChange}

                        placeholder="Password"

                        className="w-full rounded-xl border px-4 py-3"

                        required

                    />



                    <button

                        type="submit"

                        className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600"

                    >

                        Register

                    </button>


                </form>



                {message && (

                    <p className="mt-4 text-sm text-green-600">

                        {message}

                    </p>

                )}



            </div>


        </main>

    )

}


export default Register