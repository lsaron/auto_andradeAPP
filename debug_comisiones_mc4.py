#!/usr/bin/env python3
"""
Script para debuggear las comisiones del MC-4
"""

from app.models.database import SessionLocal
from app.models.comisiones_mecanicos import ComisionMecanico
from app.models.trabajos_mecanicos import TrabajoMecanico
from app.models.trabajos import Trabajo
from app.models.detalle_gastos import DetalleGasto
from sqlalchemy import func
from decimal import Decimal

def debug_mc4():
    db = SessionLocal()
    try:
        print("🔍 Debug de comisiones para MC-4 (Charry)")
        print("=" * 50)
        
        # Obtener trabajos asignados al MC-4
        trabajos_mecanico = db.query(TrabajoMecanico).filter(
            TrabajoMecanico.id_mecanico == 4
        ).all()
        
        print(f"📋 Trabajos asignados al MC-4: {len(trabajos_mecanico)}")
        
        total_ganancias = Decimal('0.00')
        total_comisiones = Decimal('0.00')
        
        for trabajo_mecanico in trabajos_mecanico:
            trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_mecanico.id_trabajo).first()
            if trabajo:
                print(f"\n🔧 Trabajo {trabajo.id}: {trabajo.descripcion}")
                print(f"   Matrícula: {trabajo.matricula_carro}")
                print(f"   Mano de obra: ₡{trabajo.mano_obra}")
                print(f"   Costo total: ₡{trabajo.costo}")
                
                # Calcular gastos reales
                gastos_reales = db.query(func.sum(DetalleGasto.monto)).filter(
                    DetalleGasto.id_trabajo == trabajo.id
                ).scalar() or Decimal('0.00')
                print(f"   Gastos reales: ₡{gastos_reales}")
                
                # Calcular ganancia base
                ganancia_base = Decimal(str(trabajo.mano_obra or 0)) - Decimal(str(gastos_reales))
                print(f"   Ganancia base: ₡{ganancia_base}")
                
                # Calcular comisión total del trabajo
                comision_total = ganancia_base * Decimal('0.02') if ganancia_base > 0 else Decimal('0.00')
                print(f"   Comisión total (2%): ₡{comision_total}")
                
                # Contar mecánicos en este trabajo
                total_mecanicos_trabajo = db.query(TrabajoMecanico).filter(
                    TrabajoMecanico.id_trabajo == trabajo.id
                ).count()
                print(f"   Mecánicos en el trabajo: {total_mecanicos_trabajo}")
                
                # Calcular comisión individual
                comision_individual = comision_total / total_mecanicos_trabajo if total_mecanicos_trabajo > 0 else Decimal('0.00')
                print(f"   Comisión individual: ₡{comision_individual}")
                
                total_ganancias += ganancia_base
                total_comisiones += comision_individual
        
        print(f"\n📊 RESUMEN:")
        print(f"   Total ganancias base: ₡{total_ganancias}")
        print(f"   Total comisiones individuales: ₡{total_comisiones}")
        
        # Verificar comisiones almacenadas en la base de datos
        print(f"\n💾 Comisiones almacenadas en BD:")
        comisiones_bd = db.query(ComisionMecanico).filter(ComisionMecanico.id_mecanico == 4).all()
        for comision in comisiones_bd:
            print(f"   Trabajo {comision.id_trabajo}: Ganancia {comision.ganancia_trabajo}, Comisión {comision.monto_comision}")
        
        # Verificar si hay discrepancia
        comisiones_bd_total = sum(Decimal(str(c.monto_comision)) for c in comisiones_bd)
        print(f"   Total comisiones en BD: ₡{comisiones_bd_total}")
        
        if comisiones_bd_total != total_comisiones:
            print(f"   ⚠️  DISCREPANCIA: BD muestra ₡{comisiones_bd_total}, cálculo muestra ₡{total_comisiones}")
        else:
            print(f"   ✅ Coincidencia perfecta entre BD y cálculo")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_mc4()
