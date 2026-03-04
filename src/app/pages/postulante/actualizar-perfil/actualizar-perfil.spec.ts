import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarPerfil } from './actualizar-perfil';

describe('ActualizarPerfil', () => {
  let component: ActualizarPerfil;
  let fixture: ComponentFixture<ActualizarPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarPerfil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarPerfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
