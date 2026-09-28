import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'


// Fix Leaflet's default marker icons when bundled with Vite.
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
})


const DHAKA_CENTER = [23.8103, 90.4125]


function RestaurantMap({
    branches = [],
    height = '420px',
    onBranchSelect,
}) {
    const mappedBranches = branches.filter((branch) => {
        const latitude = Number(branch.latitude)
        const longitude = Number(branch.longitude)

        return (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
        )
    })

    return (
        <div
            style={{
                height,
                width: '100%',
                overflow: 'hidden',
                borderRadius: '16px',
            }}
        >
            <MapContainer
                center={DHAKA_CENTER}
                zoom={12}
                scrollWheelZoom
                style={{
                    height: '100%',
                    width: '100%',
                }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />

                {mappedBranches.map((branch) => (
                    <Marker
                        key={branch.id}
                        position={[
                            Number(branch.latitude),
                            Number(branch.longitude),
                        ]}
                        eventHandlers={{
                            click: () => onBranchSelect?.(branch),
                        }}
                    >
                        <Popup>
                            <div>
                                <strong>
                                    {branch.restaurant_name || branch.restaurant?.name || branch.name}
                                </strong>

                                {branch.restaurant_name && (
                                    <div>{branch.name}</div>
                                )}

                                {branch.address && (
                                    <div>{branch.address}</div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}


export default RestaurantMap