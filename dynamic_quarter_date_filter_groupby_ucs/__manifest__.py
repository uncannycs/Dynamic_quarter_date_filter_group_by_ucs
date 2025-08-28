# -*- coding: utf-8 -*-
# Part of Odoo Module Developed by CandidRoot Solutions Pvt. Ltd.
# See LICENSE file for full copyright and licensing details.

{
    "name": "Dynamic Quarter Date Filter Ucs",
    "summary": "Dynamic Quarter Date Filter",
    "category": "Filter",
    "version": "17.0.0.0",
    "website": "https://www.uncannycs.com",
    "author": "Uncanny Consulting Services LLP",
    "maintainers": "Uncanny Consulting Services LLP",
    "license": "Other proprietary",
    "description": """ """,
    "depends": ['base', 'web','sale'],
    'images': ['static/description/icon.jpg'],
    'icon':'dynamic_quarter_date_filter_groupby_ucs/static/description/icon.png',
    'assets': {
        'web.assets_backend': [
            'dynamic_quarter_date_filter_groupby_ucs/static/src/js/dynamic_date_js.js',
        ],
    },

    "installable": True,
    'application': True, 
    'license': 'LGPL-3',
    'live_test_url': '',
}
