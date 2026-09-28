import L from 'leaflet'
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'


const DHAKA_CENTER = [23.8103, 90.4125]


const restaurantIcon = L.divIcon({
    className: '',
    html: `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: #f97316;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      transform: rotate(-45deg);
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        margin: 7px;
      "></div>
    </div>
  `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
})


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
                        icon={restaurantIcon}
                        position={[
                            Number(branch.latitude),
                            Number(branch.longitude),
                        ]}
                        eventHandlers={{
                            click: () =>
                                onBranchSelect?.(branch),
                        }}
                    >

                        <Popup>

                            <div>

                                <strong>
                                    {branch.restaurant_name ||
                                        branch.restaurant?.name ||
                                        branch.name}
                                </strong>

                                {branch.restaurant_name && (
                                    <div>
                                        {branch.name}
                                    </div>
                                )}

                                {branch.address && (
                                    <div>
                                        {branch.address}
                                    </div>
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