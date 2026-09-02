const API_URL = "http://127.0.0.1:8000/api"


export async function registerUser(data) {

    const response = await fetch(
        `${API_URL}/accounts/register/`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify(data),
        }
    )


    return response.json()

}



export async function loginUser(data) {

    const response = await fetch(
        `${API_URL}/accounts/login/`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify(data),
        }
    )


    return response.json()

}