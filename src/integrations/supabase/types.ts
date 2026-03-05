export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bm_lines: {
        Row: {
          acumulado_anterior_qtd: number
          acumulado_anterior_valor: number
          acumulado_total_qtd: number
          acumulado_total_valor: number
          bm_id: string
          centro_custo: string | null
          created_at: string
          descricao: string
          descricao_bm: string
          execucao_percent: number
          id: string
          linha: string
          medido_atual_qtd: number
          medido_atual_valor: number
          order_line_id: string
          quantidade_contratada: number
          saldo_qtd: number
          saldo_valor: number
          unidade: string
          user_id: string
          valor_total_contrato: number
          valor_unitario: number
        }
        Insert: {
          acumulado_anterior_qtd?: number
          acumulado_anterior_valor?: number
          acumulado_total_qtd?: number
          acumulado_total_valor?: number
          bm_id: string
          centro_custo?: string | null
          created_at?: string
          descricao: string
          descricao_bm?: string
          execucao_percent?: number
          id?: string
          linha: string
          medido_atual_qtd?: number
          medido_atual_valor?: number
          order_line_id: string
          quantidade_contratada?: number
          saldo_qtd?: number
          saldo_valor?: number
          unidade: string
          user_id: string
          valor_total_contrato?: number
          valor_unitario?: number
        }
        Update: {
          acumulado_anterior_qtd?: number
          acumulado_anterior_valor?: number
          acumulado_total_qtd?: number
          acumulado_total_valor?: number
          bm_id?: string
          centro_custo?: string | null
          created_at?: string
          descricao?: string
          descricao_bm?: string
          execucao_percent?: number
          id?: string
          linha?: string
          medido_atual_qtd?: number
          medido_atual_valor?: number
          order_line_id?: string
          quantidade_contratada?: number
          saldo_qtd?: number
          saldo_valor?: number
          unidade?: string
          user_id?: string
          valor_total_contrato?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "bm_lines_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "boletins_medicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bm_lines_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      boletins_medicao: {
        Row: {
          contract_id: string
          created_at: string
          data_emissao: string
          id: string
          numero: number
          periodo_fim: string
          periodo_inicio: string
          status: string
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          data_emissao: string
          id?: string
          numero: number
          periodo_fim: string
          periodo_inicio: string
          status?: string
          updated_at?: string
          user_id: string
          valor_total?: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          data_emissao?: string
          id?: string
          numero?: number
          periodo_fim?: string
          periodo_inicio?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "boletins_medicao_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          cnpj: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          fornecedor: string
          id: string
          numero: string
          numero_pedido: string | null
          objeto: string | null
          tipo: string
          tipo_label: string
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          fornecedor: string
          id?: string
          numero: string
          numero_pedido?: string | null
          objeto?: string | null
          tipo?: string
          tipo_label?: string
          updated_at?: string
          user_id: string
          valor_total?: number
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          fornecedor?: string
          id?: string
          numero?: string
          numero_pedido?: string | null
          objeto?: string | null
          tipo?: string
          tipo_label?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: []
      }
      order_lines: {
        Row: {
          contract_id: string
          created_at: string
          descricao: string
          id: string
          linha: string
          pedido_id: string | null
          quantidade: number
          unidade: string
          updated_at: string
          user_id: string
          valor_unitario: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          descricao: string
          id?: string
          linha: string
          pedido_id?: string | null
          quantidade?: number
          unidade: string
          updated_at?: string
          user_id: string
          valor_unitario?: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          descricao?: string
          id?: string
          linha?: string
          pedido_id?: string | null
          quantidade?: number
          unidade?: string
          updated_at?: string
          user_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          numero: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          numero: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          numero?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
