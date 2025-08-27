from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import clientes, carros, trabajos, historial_duenos, detalle_gastos, reportes, mecanicos, auth, gastos_taller, pagos_salarios

app = FastAPI()

# ✅ Activar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # Específicamente para Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Registrar rutas
app.include_router(clientes.router, prefix="/api")
app.include_router(carros.router, prefix="/api")
app.include_router(trabajos.router, prefix="/api")
app.include_router(historial_duenos.router, prefix="/api")
app.include_router(detalle_gastos.router, prefix="/api")
app.include_router(reportes.router, prefix="/api")
app.include_router(mecanicos.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(gastos_taller.router, prefix="/api")
app.include_router(pagos_salarios.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Bienvenido a Auto Andrade API"}
