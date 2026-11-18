<?php

return [
    'campus_code' => env('WECCE_CAMPUS_CODE', 'ugb'),
    'campus_nom' => env('WECCE_CAMPUS_NOM', 'Université Gaston Berger (Saint-Louis)'),
    'partenaire_nom' => env('WECCE_PARTENAIRE_NOM', 'LBC (Leye Business Company)'),
    'partenaire_lieu' => env('WECCE_PARTENAIRE_LIEU', "LBC, campus de l'UGB, entre les villages E et F"),
    'reference_date' => env('WECCE_REFERENCE_DATE'),
    'appointment_times' => [
        '9 h 30',
        '10 h 00',
        '10 h 30',
        '11 h 00',
        '14 h 00',
        '15 h 00',
        '15 h 30',
        '16 h 30',
    ],
];
