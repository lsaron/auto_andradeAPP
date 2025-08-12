from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.historial_duenos import HistorialDueno
from app.schemas.historial_duenos import HistorialDuenoSchema
from app.models.clientes import Cliente
from app.models.carros import Carro
from datetime import datetime

router = APIRouter()

@router.post("/historial_duenos/cambiar_dueno")
def cambiar_dueno_carro(data: HistorialDuenoSchema, db: Session = Depends(get_db)):
    carro = db.query(Carro).filter(Carro.matricula == data.matricula_carro).first()
    if not carro:
        raise HTTPException(status_code=404, detail="Carro no encontrado")

    nuevo_dueno = db.query(Cliente).filter(Cliente.id_nacional == data.id_cliente).first()
    if not nuevo_dueno:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # ✅ Cerrar el historial del dueño actual (si existe)
    if carro.id_cliente_actual:
        ultimo_historial = (
            db.query(HistorialDueno)
            .filter(
                HistorialDueno.matricula_carro == carro.matricula,
                HistorialDueno.id_cliente == carro.id_cliente_actual,
                HistorialDueno.fecha_fin == None
            )
            .order_by(HistorialDueno.fecha_inicio.desc())
            .first()
        )
        if ultimo_historial:
            ultimo_historial.fecha_fin = datetime.utcnow()
            print(f"✅ Historial anterior cerrado: {ultimo_historial.id}")

    # ✅ Actualizar el dueño actual en la tabla `carros`
    carro.id_cliente_actual = data.id_cliente
    print(f"✅ Dueño actual actualizado: {carro.id_cliente_actual}")

    # ✅ Insertar nuevo historial
    nuevo_historial = HistorialDueno(
        matricula_carro=data.matricula_carro,
        id_cliente=data.id_cliente,
        fecha_inicio=datetime.utcnow(),
        fecha_fin=None
    )
    db.add(nuevo_historial)
    print(f"✅ Nuevo historial creado para: {nuevo_historial.id_cliente}")

    db.commit()
    db.refresh(nuevo_historial)
    return {"message": "Dueño actualizado correctamente", "historial": nuevo_historial}

@router.get("/carro/{matricula}/historial")
def obtener_historial_carro(matricula: str, db: Session = Depends(get_db)):
    """Obtener el historial completo de propietarios de un vehículo"""
    print(f"🔍 Endpoint llamado con matricula: {matricula}")
    print(f"🔍 URL del endpoint: /historial-duenos/carro/{matricula}")
    
    try:
        # Verificar si el carro existe
        carro = db.query(Carro).filter(Carro.matricula == matricula).first()
        if not carro:
            print(f"❌ Carro no encontrado: {matricula}")
            raise HTTPException(status_code=404, detail="Carro no encontrado")
        
        print(f"✅ Carro encontrado: {carro.matricula}, Dueño actual: {carro.id_cliente_actual}")
        
        # Obtener TODOS los historiales de propietarios (incluyendo el actual)
        historiales = (
            db.query(HistorialDueno)
            .filter(HistorialDueno.matricula_carro == matricula)
            .order_by(HistorialDueno.fecha_inicio.desc())
            .all()
        )
        
        print(f"🔍 Historiales encontrados en DB: {len(historiales)}")
        
        # Mostrar todos los historiales encontrados
        for i, h in enumerate(historiales):
            print(f"🔍 Historial {i+1}: ID={h.id}, Cliente={h.id_cliente}, Inicio={h.fecha_inicio}, Fin={h.fecha_fin}")
        
        resultado = []
        for historial in historiales:
            print(f"🔍 Procesando historial ID: {historial.id}, Cliente: {historial.id_cliente}, Fecha fin: {historial.fecha_fin}")
            
            # Obtener información del cliente
            cliente = db.query(Cliente).filter(Cliente.id_nacional == historial.id_cliente).first()
            
            if cliente:
                item = {
                    "id": historial.id,
                    "matricula_carro": historial.matricula_carro,
                    "id_cliente_anterior": historial.id_cliente,
                    "nombre_cliente_anterior": cliente.nombre,
                    "email_cliente_anterior": cliente.correo,
                    "telefono_cliente_anterior": cliente.telefono,
                    "fecha_cambio": historial.fecha_inicio.strftime("%Y-%m-%d") if historial.fecha_inicio else None,
                    "fecha_fin": historial.fecha_fin.strftime("%Y-%m-%d") if historial.fecha_fin else None,
                    "motivo_cambio": "Cambio de propietario"
                }
                resultado.append(item)
                print(f"✅ Cliente agregado al resultado: {cliente.nombre}")
                print(f"✅ Item creado: {item}")
            else:
                print(f"⚠️ Cliente no encontrado para ID: {historial.id_cliente}")
        
        print(f"🔍 Total de resultados: {len(resultado)}")
        print(f"🔍 Resultado final: {resultado}")
        
        # IMPORTANTE: Retornar la lista completa, no solo los anteriores
        print(f"✅ Retornando {len(resultado)} registros")
        return resultado
        
    except Exception as e:
        print(f"❌ Error en obtener_historial_carro: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener historial: {str(e)}")

@router.get("/historial_duenos/test")
def test_endpoint():
    """Endpoint de prueba para verificar que el router esté funcionando"""
    return {"message": "Router de historial_duenos funcionando correctamente"}