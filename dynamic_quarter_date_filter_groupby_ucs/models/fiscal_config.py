# -*- coding: utf-8 -*-

from odoo import models, fields, api

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'
    
    @api.model
    def get_fiscal_quarters(self):
        """Get fiscal quarters based on company's fiscal year last month"""
        last_month = int(self.env.company.fiscalyear_last_month) or 3
        start_month = (last_month % 12) + 1  # Next month after last month
        
        quarters = {}
        for quarter_num in range(1, 5):
            start_offset = (quarter_num - 1) * 3
            months = []
            for i in range(3):
                month = ((start_month + start_offset + i - 1) % 12) + 1
                months.append(month)
            quarters[quarter_num] = {
                'description': f'Q{quarter_num}',
                'coveredMonths': months
            }
        
        return quarters


# # -*- coding: utf-8 -*-

# from odoo import models, fields, api

# class ResConfigSettings(models.TransientModel):
#     _inherit = 'res.config.settings'
    
#     @api.model
#     def get_fiscal_quarters(self):
#         """Get fiscal quarters based on company's fiscal year last month"""
#         last_month = int(self.env.company.fiscalyear_last_month) or 3
#         # Fiscal year starts from the month immediately after last_month
#         start_month = 1 if last_month == 12 else last_month + 1

#         quarters = {}
#         for quarter_num in range(1, 5):
#             start_offset = (quarter_num - 1) * 3
#             months = []
#             for i in range(3):
#                 month = ((start_month + start_offset + i - 1) % 12) + 1
#                 months.append(month)
#             quarters[quarter_num] = {
#                 'description': f'Q{quarter_num}',
#                 'coveredMonths': months
#             }
        
#         return quarters
