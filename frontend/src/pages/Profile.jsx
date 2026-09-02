import { useEffect, useState } from 'react'


function Profile() {

    const [user, setUser] = useState(null)


    useEffect(() => {

        const token = localStorage.getItem(
            'access_token'
        )


        fetch(
            'http://127.0.0.1:8000/api/accounts/profile/',
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then(response => response.json())
            .then(data => setUser(data))

    }, [])



    return (

        <main className="min-h-screen bg-[#fdf8f0] p-10">


            <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">


                <h1 className="text-3xl font-bold text-gray-900">

                    My Profile

                </h1>


                {user ? (

                    <div className="mt-6 space-y-3 text-gray-700">

                        <p>
                            <strong>
                                Username:
                            </strong>{" "}
                            {user.username}
                        </p>


                        <p>
                            <strong>
                                Email:
                            </strong>{" "}
                            {user.email}
                        </p>

                    </div>


                ) : (

                    <p className="mt-6 text-gray-500">
                        Loading profile...
                    </p>

                )}


            </div>


        </main>

    )

}


export default Profile