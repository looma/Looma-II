<?php
/*
    Which optional features this box actually has.

    The semantic stack — the search service plus looma-ai — is what powers three
    things a teacher sees: semantic search, the AI Assistant, and exam
    generation. It is heavy (torch, an embedding model, an index over the whole
    curriculum), so the installer lets a school leave it out. On a box installed
    WITHOUT it, those three must not be offered at all: a button that opens a
    dialog which then fails to answer is worse than no button.

    The installer sets LOOMA_SEMANTIC=0 in that case (SetEnv in the Apache vhost
    for a native install, the service environment for Docker). LOOMA_ZVEC is the
    legacy name for the same switch and is still honoured. Anything else — unset
    included — means the stack is there, so a box installed before this flag
    existed keeps all its features.
*/

if (!function_exists('looma_semantic_enabled')) {
    /*
        Is the semantic stack installed on this box?

        RENAMED from looma_zvec_enabled(). The old name said "zvec", which is
        only half true: the stack is looma-search PLUS looma-ai, and only the
        second one actually uses the zvec library. The search half is a NumPy
        matrix. Calling the whole switch "zvec" is what made people look for a
        vector database inside the search service, where there has never been
        one.

        Both env var names are read, new one first, because a box installed
        before this rename has `SetEnv LOOMA_ZVEC` baked into its Apache vhost
        and must keep working untouched.
    */
    function looma_semantic_enabled()
    {
        $flag = getenv('LOOMA_SEMANTIC');
        if ($flag === false || $flag === '') {
            $flag = getenv('LOOMA_ZVEC');   // legacy name, still on installed boxes
        }
        if ($flag === false || $flag === '') {
            return true;            // not configured => assume the stack is present
        }
        $flag = strtolower(trim((string) $flag));
        return !in_array($flag, ['0', 'off', 'false', 'no'], true);
    }
}

if (!function_exists('looma_zvec_enabled')) {
    /* Deprecated alias. Kept so third-party/older page code keeps working. */
    function looma_zvec_enabled()
    {
        return looma_semantic_enabled();
    }
}

if (!function_exists('looma_ai_enabled')) {
    /*
        The assistant half of the stack (looma-ai). It is what ANSWERS questions
        and BUILDS exams, and it can be left out on its own — a school can keep
        semantic search (looma-search alone is much lighter) without the AI. So
        the two are tracked separately: hiding the AI buttons must not also hide
        search, and showing them requires looma-ai to actually be running.
    */
    function looma_ai_enabled()
    {
        if (!looma_semantic_enabled()) {
            return false;           // looma-ai never runs without the stack under it
        }
        $flag = getenv('LOOMA_AI');
        if ($flag === false || $flag === '') {
            return true;
        }
        $flag = strtolower(trim((string) $flag));
        return !in_array($flag, ['0', 'off', 'false', 'no'], true);
    }
}

if (!function_exists('looma_feature_flags_json')) {
    function looma_feature_flags_json()
    {
        $semantic = looma_semantic_enabled();
        $ai = looma_ai_enabled();
        return json_encode([
            // `zvec` is kept in the payload for the JS that already reads it.
            'zvec' => $semantic,
            'semantic' => $semantic,
            'search' => $semantic,    // looma-search
            'assistant' => $ai,       // looma-ai
            'exams' => $ai,           // looma-ai builds them from the chapter text
        ]);
    }
}
