"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "./profile-settings"
import { CompanySettings } from "./company-settings"
import { CurrencySettings } from "./currency-settings"
import { UserManagement } from "./user-management"
import { StoreManagement } from "./store-management"

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  is_active: boolean
}

type SystemSetting = {
  id: string
  setting_key: string
  setting_value: string | null
}

type Currency = {
  id: string
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_default: boolean
}

export function SettingsTabs({
  profile,
  settings,
  currencies,
}: {
  profile: Profile | null
  settings: SystemSetting[]
  currencies: Currency[]
}) {
  const isAdmin = profile?.role === "admin"

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="currency">Currency</TabsTrigger>
        {isAdmin && <TabsTrigger value="stores">Stores</TabsTrigger>}
        {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <ProfileSettings profile={profile} />
      </TabsContent>

      <TabsContent value="company" className="space-y-4">
        <CompanySettings settings={settings} />
      </TabsContent>

      <TabsContent value="currency" className="space-y-4">
        <CurrencySettings currencies={currencies} />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="stores" className="space-y-4">
          <StoreManagement />
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
      )}
    </Tabs>
  )
}
