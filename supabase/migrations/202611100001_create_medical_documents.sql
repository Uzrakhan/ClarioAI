BEGIN;

CREATE TABLE public.medical_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL
        REFERENCES public.patients (id) ON DELETE RESTRICT,
    uploaded_by_user_id uuid NOT NULL
        REFERENCES auth.users (id) ON DELETE RESTRICT,
    bucket_id text NOT NULL DEFAULT 'medical-documents',
    storage_path text NOT NULL,
    original_filename text NOT NULL,
    mime_type text NOT NULL,
    file_size_bytes bigint NOT NULL,
    upload_status text NOT NULL DEFAULT 'uploading',
    processing_status text NOT NULL DEFAULT 'pending',
    verification_status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT medical_documents_bucket_id_check
        CHECK (bucket_id = 'medical-documents'),
    CONSTRAINT medical_documents_original_filename_check
        CHECK (
            char_length(original_filename) BETWEEN 1 AND 255
            AND original_filename = btrim(original_filename)
            AND position('/' IN original_filename) = 0
            AND position(chr(92) IN original_filename) = 0
            AND original_filename !~ '[[:cntrl:]]'
        ),
    CONSTRAINT medical_documents_mime_type_check
        CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    CONSTRAINT medical_documents_file_size_check
        CHECK (file_size_bytes BETWEEN 1 AND 10485760),
    CONSTRAINT medical_documents_upload_status_check
        CHECK (upload_status IN ('uploading', 'uploaded', 'failed', 'cleanup_required')),
    CONSTRAINT medical_documents_processing_status_check
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT medical_documents_verification_status_check
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT medical_documents_storage_path_matches_ids_check
        CHECK (
            storage_path = uploaded_by_user_id::text || '/' || patient_id::text || '/' ||
            id::text || CASE mime_type
                WHEN 'application/pdf' THEN '.pdf'
                WHEN 'image/jpeg' THEN '.jpg'
                WHEN 'image/png' THEN '.png'
            END
        ),
    CONSTRAINT medical_documents_bucket_path_key
        UNIQUE (bucket_id, storage_path)
);

COMMENT ON TABLE public.medical_documents IS
    'Private medical document metadata. Object contents are stored in Supabase Storage.';

ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- Remove default/public table grants, then grant only operations needed by the API.
REVOKE ALL ON TABLE public.medical_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.medical_documents TO authenticated;
GRANT UPDATE (upload_status)
    ON TABLE public.medical_documents TO authenticated;

CREATE INDEX medical_documents_patient_created_at_idx
    ON public.medical_documents (patient_id, created_at DESC);

CREATE INDEX medical_documents_uploaded_by_user_id_idx
    ON public.medical_documents (uploaded_by_user_id);

CREATE POLICY clario_medical_documents_select_owned_patient
    ON public.medical_documents
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.patients AS p
            WHERE p.id = medical_documents.patient_id
              AND p.owner_user_id = auth.uid()
        )
    );

CREATE POLICY clario_medical_documents_insert_owned_patient
    ON public.medical_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        uploaded_by_user_id = auth.uid()
        AND split_part(storage_path, '/', 1) = auth.uid()::text
        AND split_part(storage_path, '/', 2) = patient_id::text
        AND EXISTS (
            SELECT 1
            FROM public.patients AS p
            WHERE p.id = medical_documents.patient_id
              AND p.owner_user_id = auth.uid()
        )
    );

CREATE POLICY clario_medical_documents_update_owned_patient
    ON public.medical_documents
    FOR UPDATE TO authenticated
    USING (
        uploaded_by_user_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.patients AS p
            WHERE p.id = medical_documents.patient_id
              AND p.owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        uploaded_by_user_id = auth.uid()
        AND split_part(storage_path, '/', 1) = auth.uid()::text
        AND split_part(storage_path, '/', 2) = patient_id::text
        AND EXISTS (
            SELECT 1
            FROM public.patients AS p
            WHERE p.id = medical_documents.patient_id
              AND p.owner_user_id = auth.uid()
        )
    );

-- The path contains owner UUID / patient UUID / document UUID plus canonical extension.
-- Each predicate also ties the object to an authorized metadata row and patient.
-- These restrictive policies scope this bucket without rewriting existing policies
-- for this or any other Storage bucket.
CREATE POLICY clario_medical_documents_storage_select_guard
    ON storage.objects
    AS RESTRICTIVE FOR SELECT TO public
    USING (
        bucket_id <> 'medical-documents'
        OR (
            auth.uid() IS NOT NULL
            AND array_length(storage.foldername(name), 1) = 2
            AND (storage.foldername(name))[1] = auth.uid()::text
            AND EXISTS (
                SELECT 1
                FROM public.medical_documents AS d
                JOIN public.patients AS p ON p.id = d.patient_id
                WHERE d.bucket_id = 'medical-documents'
                  AND d.storage_path = name
                  AND d.patient_id::text = (storage.foldername(name))[2]
                  AND d.uploaded_by_user_id = auth.uid()
                  AND d.upload_status = 'uploaded'
                  AND p.owner_user_id = auth.uid()
            )
        )
    );

CREATE POLICY clario_medical_documents_storage_insert_guard
    ON storage.objects
    AS RESTRICTIVE FOR INSERT TO public
    WITH CHECK (
        bucket_id <> 'medical-documents'
        OR (
            auth.uid() IS NOT NULL
            AND array_length(storage.foldername(name), 1) = 2
            AND (storage.foldername(name))[1] = auth.uid()::text
            AND EXISTS (
                SELECT 1
                FROM public.medical_documents AS d
                JOIN public.patients AS p ON p.id = d.patient_id
                WHERE d.bucket_id = 'medical-documents'
                  AND d.storage_path = name
                  AND d.patient_id::text = (storage.foldername(name))[2]
                  AND d.uploaded_by_user_id = auth.uid()
                  AND d.upload_status = 'uploading'
                  AND p.owner_user_id = auth.uid()
            )
        )
    );

-- Storage objects are immutable in this upload workflow (upsert is disabled).
-- This guard also prevents any existing permissive policy from enabling updates
-- to this bucket; other buckets are unaffected.
CREATE POLICY clario_medical_documents_storage_update_guard
    ON storage.objects
    AS RESTRICTIVE FOR UPDATE TO public
    USING (bucket_id <> 'medical-documents')
    WITH CHECK (bucket_id <> 'medical-documents');

CREATE POLICY clario_medical_documents_storage_delete_guard
    ON storage.objects
    AS RESTRICTIVE FOR DELETE TO public
    USING (
        bucket_id <> 'medical-documents'
        OR (
            auth.uid() IS NOT NULL
            AND array_length(storage.foldername(name), 1) = 2
            AND (storage.foldername(name))[1] = auth.uid()::text
            AND EXISTS (
                SELECT 1
                FROM public.medical_documents AS d
                JOIN public.patients AS p ON p.id = d.patient_id
                WHERE d.bucket_id = 'medical-documents'
                  AND d.storage_path = name
                  AND d.patient_id::text = (storage.foldername(name))[2]
                  AND d.uploaded_by_user_id = auth.uid()
                  AND d.upload_status IN ('uploading', 'failed', 'cleanup_required')
                  AND p.owner_user_id = auth.uid()
            )
        )
    );

CREATE POLICY clario_medical_documents_storage_select_owned
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'medical-documents'
        AND auth.uid() IS NOT NULL
        AND array_length(storage.foldername(name), 1) = 2
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
            SELECT 1
            FROM public.medical_documents AS d
            JOIN public.patients AS p ON p.id = d.patient_id
            WHERE d.bucket_id = 'medical-documents'
              AND d.storage_path = name
              AND d.patient_id::text = (storage.foldername(name))[2]
              AND d.uploaded_by_user_id = auth.uid()
              AND d.upload_status = 'uploaded'
              AND p.owner_user_id = auth.uid()
        )
    );

CREATE POLICY clario_medical_documents_storage_insert_pending
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'medical-documents'
        AND auth.uid() IS NOT NULL
        AND array_length(storage.foldername(name), 1) = 2
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
            SELECT 1
            FROM public.medical_documents AS d
            JOIN public.patients AS p ON p.id = d.patient_id
            WHERE d.bucket_id = 'medical-documents'
              AND d.storage_path = name
              AND d.patient_id::text = (storage.foldername(name))[2]
              AND d.uploaded_by_user_id = auth.uid()
              AND d.upload_status = 'uploading'
              AND p.owner_user_id = auth.uid()
        )
    );

CREATE POLICY clario_medical_documents_storage_delete_cleanup
    ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'medical-documents'
        AND auth.uid() IS NOT NULL
        AND array_length(storage.foldername(name), 1) = 2
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
            SELECT 1
            FROM public.medical_documents AS d
            JOIN public.patients AS p ON p.id = d.patient_id
            WHERE d.bucket_id = 'medical-documents'
              AND d.storage_path = name
              AND d.patient_id::text = (storage.foldername(name))[2]
              AND d.uploaded_by_user_id = auth.uid()
              AND d.upload_status IN ('uploading', 'failed', 'cleanup_required')
              AND p.owner_user_id = auth.uid()
        )
    );

COMMIT;
