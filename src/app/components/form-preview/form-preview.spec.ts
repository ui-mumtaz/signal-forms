import { TestBed } from '@angular/core/testing';
import { FormField } from '../../models/field';
import { FormService } from '../../services/form.service';
import { FormPreview } from './form-preview';

describe('FormPreview', () => {
  let formService: FormService;

  function createPreview() {
    const fixture = TestBed.createComponent(FormPreview);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function addField(overrides: Partial<FormField>) {
    const rowId = formService.rows()[0].id;
    formService.addField(overrides.type ?? 'text', rowId);
    const field = formService.allFields().at(-1)!;
    formService.updateField(field.id, overrides);
    return formService.allFields().find((f) => f.id === field.id)!;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    formService = TestBed.inject(FormService);
    formService.clear();
  });

  it('is invalid while a required field is empty, and valid once filled', () => {
    const field = addField({ required: true });
    const component = createPreview();

    const root = component['userForm']();
    expect(root().valid()).toBe(false);
    expect(component['control'](field.name)().errors()[0]?.message).toBe(`${field.label || 'This field'} is required`);

    root().value.set({ [field.name]: 'hello' });
    expect(root().valid()).toBe(true);
  });

  it('treats an unchecked required checkbox as empty, same as requiredTrue did', () => {
    const field = addField({ type: 'checkbox', required: true });
    const component = createPreview();

    const root = component['userForm']();
    expect(root().valid()).toBe(false);

    root().value.set({ [field.name]: true });
    expect(root().valid()).toBe(true);
  });

  it('validates email format with the expected message', () => {
    const field = addField({ type: 'email' });
    const component = createPreview();
    const root = component['userForm']();

    root().value.set({ [field.name]: 'not-an-email' });
    expect(root().valid()).toBe(false);
    expect(component['control'](field.name)().errors()[0]?.message).toBe('Enter a valid email address');

    root().value.set({ [field.name]: 'person@example.com' });
    expect(root().valid()).toBe(true);
  });

  it('enforces minLength/maxLength/pattern with matching messages', () => {
    const field = addField({ type: 'text', minLength: 3, maxLength: 5, pattern: '^[a-z]+$' });
    const component = createPreview();
    const root = component['userForm']();

    root().value.set({ [field.name]: 'ab' });
    expect(component['control'](field.name)().errors()[0]?.message).toBe('Minimum 3 characters');

    root().value.set({ [field.name]: 'abcdef' });
    expect(component['control'](field.name)().errors()[0]?.message).toBe('Maximum 5 characters');

    root().value.set({ [field.name]: 'ABC' });
    expect(component['control'](field.name)().errors()[0]?.message).toBe('Invalid format');

    root().value.set({ [field.name]: 'abc' });
    expect(root().valid()).toBe(true);
  });

  it('enforces min/max with matching messages', () => {
    const field = addField({ type: 'number', min: 2, max: 4 });
    const component = createPreview();
    const root = component['userForm']();

    root().value.set({ [field.name]: '1' });
    expect(component['control'](field.name)().errors()[0]?.message).toBe('Minimum value is 2');

    root().value.set({ [field.name]: '9' });
    expect(component['control'](field.name)().errors()[0]?.message).toBe('Maximum value is 4');
  });

  it('rebuilds the form and validates newly added fields when the schema changes', () => {
    const first = addField({ required: true });
    const component = createPreview();

    const second = addField({ type: 'email' });
    const root = component['userForm']();

    expect(root().valid()).toBe(false);
    root().value.set({ [first.name]: 'hi', [second.name]: 'bad' });
    expect(root().valid()).toBe(false);
    root().value.set({ [first.name]: 'hi', [second.name]: 'ok@example.com' });
    expect(root().valid()).toBe(true);
  });

  it('submit() only records the value when valid, and clears it otherwise', async () => {
    const field = addField({ required: true });
    const component = createPreview();

    await component['submit']();
    expect(component['submitted']()).toBeNull();

    component['userForm']()().value.set({ [field.name]: 'hello' });
    await component['submit']();
    expect(component['submitted']()).toEqual({ [field.name]: 'hello' });
  });

  it('reset() clears values, touched state, and the submitted result', async () => {
    const field = addField({ required: true, type: 'checkbox' });
    const component = createPreview();

    component['userForm']()().value.set({ [field.name]: true });
    await component['submit']();
    expect(component['submitted']()).toEqual({ [field.name]: true });

    component['reset']();
    expect(component['submitted']()).toBeNull();
    expect(component['userForm']()().value()).toEqual({ [field.name]: false });
    expect(component['userForm']()().touched()).toBe(false);
  });
});
