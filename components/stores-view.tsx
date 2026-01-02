"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Clock, Search } from "lucide-react"
import { useState } from "react"

const storesList = [
  {
    id: 1,
    name: "Downtown Brew",
    address: "123 Main St, Downtown",
    phone: "(555) 123-4567",
    hours: "7:00 AM - 8:00 PM",
    distance: "0.5 mi",
  },
  {
    id: 2,
    name: "Uptown Coffee",
    address: "456 Park Ave, Uptown",
    phone: "(555) 234-5678",
    hours: "6:00 AM - 9:00 PM",
    distance: "1.2 mi",
  },
  {
    id: 3,
    name: "Riverside Cafe",
    address: "789 River Rd, Riverside",
    phone: "(555) 345-6789",
    hours: "7:30 AM - 7:00 PM",
    distance: "2.1 mi",
  },
  {
    id: 4,
    name: "Campus Brew Co.",
    address: "321 University Blvd",
    phone: "(555) 456-7890",
    hours: "6:30 AM - 10:00 PM",
    distance: "3.0 mi",
  },
]

export function StoresView() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStores = storesList.filter((store) => store.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Find a Store</h1>
        <p className="text-sm text-muted-foreground">Locations near you</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search stores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {filteredStores.length > 0 ? (
          filteredStores.map((store) => (
            <Card key={store.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{store.name}</h3>
                    <p className="text-sm text-muted-foreground">{store.distance} away</p>
                  </div>
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{store.hours}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="flex flex-col items-center justify-center p-12">
            <MapPin className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-center text-muted-foreground">No stores found</p>
            <p className="text-center text-sm text-muted-foreground">Try a different search term</p>
          </Card>
        )}
      </div>
    </div>
  )
}
