import { useEffect, useMemo, useState } from 'react'

import {
  getManagedRestaurants,
  getRestaurantManagerProfile,
  updateManagedRestaurant,
} from '../../api/managerApi'
import ManagerLayout from '../../components/manager/ManagerLayout'


const emptyForm = {
  name: '',
  cuisine: '',
  description: '',
  image_url: '',
}


function restaurantToForm(restaurant) {
  return {
    name: restaurant?.name || '',
    cuisine: restaurant?.cuisine || '',
    description: restaurant?.description || '',
    image_url: restaurant?.image_url || '',
  }
}


function ManagerRestaurantProfile() {
  const [profile, setProfile] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [savedForm, setSavedForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const selectedRestaurant = useMemo(() => (
    restaurants.find(
      (restaurant) => String(restaurant.id) === selectedRestaurantId,
    ) || null
  ), [restaurants, selectedRestaurantId])

  const hasChanges = JSON.stringify(form) !== JSON.stringify(savedForm)
  const hasInitialLoadError = Boolean(
    errorMessage
    && restaurants.length === 0
    && (
      !profile
      || profile.assigned_restaurants.length > 0
    ),
  )

  function applyRestaurant(restaurant) {
    const nextForm = restaurantToForm(restaurant)

    setSelectedRestaurantId(
      restaurant ? String(restaurant.id) : '',
    )
    setForm(nextForm)
    setSavedForm(nextForm)
  }

  async function loadPage() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const managerProfile = await getRestaurantManagerProfile()
      setProfile(managerProfile)

      if (managerProfile.assigned_restaurants.length === 0) {
        setRestaurants([])
        applyRestaurant(null)
        return
      }

      const restaurantData = await getManagedRestaurants()
      setRestaurants(restaurantData)
      applyRestaurant(restaurantData[0] || null)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const managerProfile = await getRestaurantManagerProfile()

        if (isCancelled) {
          return
        }

        setProfile(managerProfile)

        if (managerProfile.assigned_restaurants.length === 0) {
          return
        }

        const restaurantData = await getManagedRestaurants()

        if (!isCancelled) {
          setRestaurants(restaurantData)

          const firstRestaurant = restaurantData[0] || null
          const firstForm = restaurantToForm(firstRestaurant)

          setSelectedRestaurantId(
            firstRestaurant ? String(firstRestaurant.id) : '',
          )
          setForm(firstForm)
          setSavedForm(firstForm)
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [])

  function handleRestaurantChange(event) {
    const nextRestaurant = restaurants.find(
      (restaurant) => String(restaurant.id) === event.target.value,
    )

    if (hasChanges && !window.confirm(
      'Discard the unsaved changes and switch restaurants?',
    )) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    applyRestaurant(nextRestaurant || null)
  }

  function handleFieldChange(event) {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
    setSuccessMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedRestaurant) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const updatedRestaurant = await updateManagedRestaurant(
        selectedRestaurant.id,
        form,
      )

      setRestaurants((currentRestaurants) => (
        currentRestaurants.map((restaurant) => (
          restaurant.id === updatedRestaurant.id
            ? updatedRestaurant
            : restaurant
        ))
      ))

      const updatedForm = restaurantToForm(updatedRestaurant)
      setForm(updatedForm)
      setSavedForm(updatedForm)
      setSuccessMessage('Restaurant profile updated successfully.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ManagerLayout profile={profile}>
      <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
          Restaurant management
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Restaurant Profile
        </h1>
      </header>

      <main
        id="manager-main"
        tabIndex="-1"
        className="px-6 py-8 sm:px-9 sm:py-10"
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Public restaurant information
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Update only the restaurant details visible to customers. Rating
              and platform activation remain protected fields.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPage}
            disabled={isLoading || isSaving}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Refreshing...' : 'Refresh profile'}
          </button>
        </div>

        {(errorMessage || successMessage) && (
          <div
            role={errorMessage ? 'alert' : 'status'}
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${errorMessage
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {errorMessage || successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
            Loading restaurant profile...
          </div>
        ) : hasInitialLoadError ? (
          <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h3 className="font-bold text-slate-900">
              Restaurant profile data is unavailable
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Use Refresh profile to try loading the assigned restaurant
              records again.
            </p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h3 className="font-bold text-slate-900">
              No active restaurant assignment
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              A Platform Admin must assign this account to an active
              restaurant before its public profile can be managed.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-7 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {selectedRestaurant?.image_url ? (
                <img
                  src={selectedRestaurant.image_url}
                  alt=""
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-6xl font-bold text-orange-300">
                  {selectedRestaurant?.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Active
                  </span>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                    Rating {selectedRestaurant?.rating}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  {selectedRestaurant?.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedRestaurant?.cuisine || 'Cuisine not provided'}
                </p>

                {restaurants.length > 1 && (
                  <label className="mt-6 block text-sm font-semibold text-slate-700">
                    Assigned restaurant
                    <select
                      value={selectedRestaurantId}
                      onChange={handleRestaurantChange}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
                    >
                      {restaurants.map((restaurant) => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </aside>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Restaurant name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFieldChange}
                    maxLength="150"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Cuisine
                  <input
                    name="cuisine"
                    value={form.cuisine}
                    onChange={handleFieldChange}
                    maxLength="150"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
                  />
                </label>
              </div>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFieldChange}
                  rows="7"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal leading-6 outline-none focus:border-orange-400 focus:bg-white"
                />
              </label>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Image URL
                <input
                  name="image_url"
                  type="url"
                  value={form.image_url}
                  onChange={handleFieldChange}
                  placeholder="https://example.com/restaurant.jpg"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-orange-400 focus:bg-white"
                />
              </label>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForm(savedForm)
                    setErrorMessage('')
                    setSuccessMessage('')
                  }}
                  disabled={!hasChanges || isSaving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Discard changes
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || isSaving || !form.name.trim()}
                  className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save restaurant profile'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </ManagerLayout>
  )
}


export default ManagerRestaurantProfile
