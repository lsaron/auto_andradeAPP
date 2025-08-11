"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Bell, Shield, Palette, Database } from "lucide-react"

export function SettingsSection() {
  const [settings, setSettings] = useState({
    companyName: "Auto Andrade",
    companyAddress: "Av. Principal 123, Ciudad de México",
    companyPhone: "+52 555 123 4567",
    companyEmail: "contacto@autoandrade.com",
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maintenanceReminders: true,
    },
    system: {
      autoBackup: true,
      darkMode: false,
      language: "es",
              currency: "CRC",
    },
  })

  const handleSave = () => {
    // Aquí se implementaría la lógica para guardar la configuración
    console.log("Configuración guardada:", settings)
  }

  const updateCompanyInfo = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateNotifications = (field: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }))
  }

  const updateSystem = (field: string, value: boolean | string) => {
    setSettings((prev) => ({
      ...prev,
      system: {
        ...prev.system,
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra la configuración del sistema y la empresa</p>
      </div>

      <div className="grid gap-6">
        {/* Información de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Información de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => updateCompanyInfo("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Teléfono</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => updateCompanyInfo("companyPhone", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => updateCompanyInfo("companyEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Dirección</Label>
              <Textarea
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => updateCompanyInfo("companyAddress", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Recibir notificaciones importantes por correo electrónico
                </p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) => updateNotifications("emailNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones SMS</Label>
                <p className="text-sm text-muted-foreground">Recibir alertas urgentes por mensaje de texto</p>
              </div>
              <Switch
                checked={settings.notifications.smsNotifications}
                onCheckedChange={(checked) => updateNotifications("smsNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones Push</Label>
                <p className="text-sm text-muted-foreground">Mostrar notificaciones en el navegador</p>
              </div>
              <Switch
                checked={settings.notifications.pushNotifications}
                onCheckedChange={(checked) => updateNotifications("pushNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorios de Mantenimiento</Label>
                <p className="text-sm text-muted-foreground">Alertas automáticas para servicios programados</p>
              </div>
              <Switch
                checked={settings.notifications.maintenanceReminders}
                onCheckedChange={(checked) => updateNotifications("maintenanceReminders", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Respaldo Automático</Label>
                <p className="text-sm text-muted-foreground">Crear copias de seguridad automáticas diariamente</p>
              </div>
              <Switch
                checked={settings.system.autoBackup}
                onCheckedChange={(checked) => updateSystem("autoBackup", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Oscuro</Label>
                <p className="text-sm text-muted-foreground">Cambiar a tema oscuro para mejor visualización</p>
              </div>
              <Switch
                checked={settings.system.darkMode}
                onCheckedChange={(checked) => updateSystem("darkMode", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Apariencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <select
                  id="language"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.system.language}
                  onChange={(e) => updateSystem("language", e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.system.currency}
                  onChange={(e) => updateSystem("currency", e.target.value)}
                >
                  <option value="CRC">Colones (CRC)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  )
}
