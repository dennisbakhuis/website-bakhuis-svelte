<script lang="ts">
  import { onMount } from 'svelte';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { env } from '$env/dynamic/public';
  import {
    contactSchema,
    type ContactFormData,
    type FormFailureCode,
  } from '$lib/forms/contact-schema';
  import { capWidgetI18nProps } from '$lib/forms/cap-widget-i18n';
  import { toast } from '$lib/divelog/stores/toast.svelte';

  type Props = { data: SuperValidated<ContactFormData> };

  let { data }: Props = $props();

  let submitAttempted = $state(false);

  const FAILURES: Record<FormFailureCode, string> = {
    rate_limited: 'Too many messages in a row — please try again in a few minutes.',
    cap_failed: 'The human check expired. Tick it again and resend.',
    submission_failed: 'Sending failed. Try again later or e-mail me directly.',
  };

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, submitting, allErrors } = superForm(data, {
    validators: zodClient(contactSchema),
    onSubmit() {
      submitAttempted = true;
    },
    onResult({ result }) {
      if (result.type === 'success') {
        submitAttempted = false;
        toast.show({ kind: 'success', message: 'Thanks! I will get back to you soon.' });
      } else if (result.type === 'failure') {
        const code = (result.data as { code?: FormFailureCode } | undefined)?.code;
        if (code) toast.show({ kind: 'error', message: FAILURES[code] });
      } else if (result.type === 'error') {
        toast.show({ kind: 'error', message: FAILURES.submission_failed });
      }
    },
  });

  const apiEndpoint = env.PUBLIC_CAP_API_ENDPOINT ?? '';
  const capEnabled = (env.PUBLIC_CAP_ENABLED ?? '').toLowerCase() === 'true';
  const showCapWidget = capEnabled && !!apiEndpoint;

  if (!showCapWidget && !$form.capToken) {
    $form.capToken = 'disabled';
  }

  const showErrorSummary = $derived(submitAttempted && $allErrors.length > 0);

  let capWidget: HTMLElement | undefined = $state();

  onMount(() => {
    if (!capWidget || !showCapWidget) return;
    void import('$lib/cap-widget-loader').then((m) => m.loadCapWidget());
    const onSolve = (e: Event) => {
      $form.capToken = (e as CustomEvent<{ token: string }>).detail.token;
    };
    const onReset = () => {
      $form.capToken = '';
    };
    capWidget.addEventListener('solve', onSolve);
    capWidget.addEventListener('reset', onReset);
    return () => {
      capWidget?.removeEventListener('solve', onSolve);
      capWidget?.removeEventListener('reset', onReset);
    };
  });
</script>

<form method="POST" use:enhance class="contact-form">
  <div class="form-row">
    <div class="form-group">
      <label for="name">Name</label>
      <input
        id="name"
        name="name"
        type="text"
        autocomplete="name"
        bind:value={$form.name}
        aria-invalid={!!$errors.name}
        required
      />
      {#if $errors.name}<p class="form-error">{$errors.name[0]}</p>{/if}
    </div>
    <div class="form-group">
      <label for="email">E-mail</label>
      <input
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        bind:value={$form.email}
        aria-invalid={!!$errors.email}
        required
      />
      {#if $errors.email}<p class="form-error">{$errors.email[0]}</p>{/if}
    </div>
  </div>

  <div class="form-group">
    <label for="message">Message</label>
    <textarea
      id="message"
      name="message"
      rows={7}
      maxlength={4000}
      bind:value={$form.message}
      aria-invalid={!!$errors.message}
      required
    ></textarea>
    {#if $errors.message}<p class="form-error">{$errors.message[0]}</p>{/if}
  </div>

  <div class="form-group hp-field" aria-hidden="true">
    <label for="website">Website</label>
    <input
      id="website"
      name="website"
      type="text"
      tabindex="-1"
      autocomplete="off"
      bind:value={$form.website}
    />
  </div>

  {#if showErrorSummary}
    <p class="form-summary" role="alert" aria-live="polite">
      Check the highlighted fields and try again.
    </p>
  {/if}

  <div class="cap-submit-row">
    {#if showCapWidget}
      <div class="form-group">
        <cap-widget
          bind:this={capWidget}
          data-cap-api-endpoint={apiEndpoint}
          {...capWidgetI18nProps()}
          style="--cap-widget-height:43px;--cap-widget-padding:8px 12px;--cap-checkbox-size:18px;--cap-gap:10px;--cap-border-radius:var(--radius-sm);--cap-background:var(--color-surface);--cap-border-color:var(--color-border);--cap-color:var(--color-text);--cap-checkbox-border:1px solid var(--color-border-strong);"
        ></cap-widget>
        <input type="hidden" name="capToken" bind:value={$form.capToken} />
        {#if $errors.capToken}<p class="form-error">{$errors.capToken[0]}</p>{/if}
      </div>
    {:else}
      <input type="hidden" name="capToken" value="disabled" />
    {/if}

    <button type="submit" class="btn btn-solid" disabled={$submitting}>
      {$submitting ? 'Sending…' : 'Send message'}
    </button>
  </div>
</form>

<style>
  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .form-row {
    display: grid;
    gap: 18px;
  }
  @media (min-width: 640px) {
    .form-row {
      grid-template-columns: 1fr 1fr;
    }
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  label {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
  }
  input,
  textarea {
    font: inherit;
    font-size: 15.5px;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    transition: border-color 0.15s ease;
  }
  input:focus,
  textarea:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 1px;
    border-color: var(--color-focus-ring);
  }
  input[aria-invalid='true'],
  textarea[aria-invalid='true'] {
    border-color: var(--color-error);
  }
  textarea {
    resize: vertical;
    min-height: 150px;
  }
  .form-error {
    margin: 0;
    font-size: 13.5px;
    color: var(--color-error);
  }
  .form-summary {
    margin: 0;
    padding: 12px 16px;
    border-left: 3px solid var(--color-error);
    background: color-mix(in srgb, var(--color-error) 10%, var(--color-surface));
    border-radius: 0 var(--radius) var(--radius) 0;
    color: var(--color-error);
    font-size: 14.5px;
  }
  .hp-field {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  .cap-submit-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 18px;
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
