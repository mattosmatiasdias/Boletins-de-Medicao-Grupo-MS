import { formatCurrency, formatDate } from './formatters';

interface BMLineForPdf {
  linha: string;
  descricao: string;
  descricaoBm: string;
  unidade: string;
  quantidadeContratada: number;
  valorUnitario: number;
  valorTotalContrato: number;
  acumuladoAnteriorQtd: number;
  acumuladoAnteriorValor: number;
  medidoAtualQtd: number;
  medidoAtualValor: number;
  acumuladoTotalQtd: number;
  acumuladoTotalValor: number;
  saldoQtd: number;
  saldoValor: number;
  execucaoPercent: number;
  centroCusto: string;
}

interface BMForPdf {
  id: string;
  numero: number;
  dataEmissao: string;
  periodoInicio: string;
  periodoFim: string;
  valorTotal: number;
  linhas: BMLineForPdf[];
  status: 'rascunho' | 'finalizado';
}

interface BMHistory {
  numero: number;
  valor_total: number | string | null;
}

interface ContractForPdf {
  id: string;
  numero: string;
  fornecedor: string;
  cnpj: string;
  objeto: string;
  tipo: 'servico' | 'locacao';
  tipoLabel: string;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
  numeroPedido: string;
}

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const parts: string[] = [];
  
  if (n >= 100) {
    parts.push(hundreds[Math.floor(n / 100)]);
    n = n % 100;
  }

  if (n >= 10 && n < 20) {
    parts.push(teens[n - 10]);
  } else {
    if (n >= 20) {
      parts.push(tens[Math.floor(n / 10)]);
      n = n % 10;
    }
    if (n > 0) {
      parts.push(units[n]);
    }
  }
  return parts.join(' e ');
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero reais';

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  const textParts: string[] = [];

  if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    const textThousands = convertChunk(thousands);
    
    if (thousands === 1) {
      textParts.push('mil');
    } else {
      textParts.push(`${textThousands} mil`);
    }
  }

  const remainder = intPart % 1000;
  if (remainder > 0) {
    textParts.push(convertChunk(remainder));
  }

  let result = textParts.length > 0 ? textParts.join(' e ') : '';
  
  if (!result) result = 'zero';

  result += ' reais';

  if (decPart > 0) {
    const decText = convertChunk(decPart);
    result += ` e ${decText} centavos`;
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function generateBMPdf(bm: BMForPdf, contract: ContractForPdf, allBms: BMHistory[] = []) {
  const totalContrato = bm.linhas.reduce((s, l) => s + l.valorTotalContrato, 0);
  const totalAcumulado = bm.linhas.reduce((s, l) => s + l.acumuladoTotalValor, 0);
  const totalSaldo = bm.linhas.reduce((s, l) => s + l.saldoValor, 0);

  const linesHtml = bm.linhas.map(l => `
    <tr>
      <td class="c">${l.linha}</td>
      <td class="l desc">${l.descricaoBm || l.descricao}</td>
      <td class="c">${l.unidade}</td>
      <td class="r">${l.quantidadeContratada}</td>
      <td class="r">${formatCurrency(l.valorUnitario)}</td>
      <td class="r">${formatCurrency(l.valorTotalContrato)}</td>
      <td class="r">${l.acumuladoAnteriorQtd.toFixed(2)}</td>
      <td class="r">${formatCurrency(l.acumuladoAnteriorValor)}</td>
      <td class="r">${l.medidoAtualQtd || 0}</td>
      <td class="r">${formatCurrency(l.medidoAtualValor || 0)}</td>
      <td class="r b">${formatCurrency(l.acumuladoTotalValor)}</td>
      <td class="r b">${formatCurrency(l.saldoValor)}</td>
      <td class="r">${l.execucaoPercent.toFixed(0)}%</td>
      <td class="c">${l.centroCusto}</td>
    </tr>
  `).join('');

  const emptyRows = Math.max(0, 8 - bm.linhas.length);
  const emptyRowsHtml = Array(emptyRows).fill('<tr>' + '<td>&nbsp;</td>'.repeat(14) + '</tr>').join('');

  let bmControlHtml = '';
  for (let row = 0; row < 5; row++) {
    bmControlHtml += '<tr>';
    for (let col = 0; col < 5; col++) {
      const bmNum = row * 5 + col + 1;
      
      let valor = 0;
      if (bmNum === bm.numero) {
        valor = bm.valorTotal;
      } else {
        const historyItem = allBms.find(b => b.numero === bmNum);
        if (historyItem) {
          valor = Number(historyItem.valor_total || 0) || 0;
        }
      }

      bmControlHtml += `<td class="ctrl-cell"><b>BM ${String(bmNum).padStart(3, '0')}</b></td>`;
      bmControlHtml += `<td class="ctrl-val">${formatCurrency(valor)}</td>`;
    }
    bmControlHtml += '</tr>';
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>BM ${String(bm.numero).padStart(3, '0')} - ${contract.fornecedor}</title>
<style>
  @page { size: landscape A4; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; color: #222; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #999; padding: 2px 4px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .l { text-align: left; }
  .b { font-weight: bold; }
  .no-border { border: none; }
  .desc { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .header-table td { border: none; padding: 2px; }
  .title { font-size: 14pt; font-weight: bold; text-align: center; }
  .subtitle { font-size: 9pt; text-align: center; font-weight: bold; }
  th { background: #1a2744; color: white; font-size: 7pt; padding: 3px 4px; }
  .total-row { background: #f0f0f0; font-weight: bold; }
  .section-title { font-weight: bold; font-size: 8pt; padding: 4px; background: #eee; }
  .footer-table td { font-size: 7pt; vertical-align: top; }
  .ctrl-cell { font-size: 6.5pt; width: 50px; text-align: center; background: #f8f8f8; }
  .ctrl-val { font-size: 6.5pt; width: 60px; text-align: right; }
  .info-label { font-weight: bold; font-size: 7pt; }
  .info-val { font-size: 7pt; }
</style></head><body>

<table class="header-table" style="margin-bottom: 4px;">
  <tr>
    <td style="width: 25%; vertical-align: top;">
      <div style="font-weight:bold; font-size: 8pt;">${contract.fornecedor}</div>
      <div style="font-size: 7pt;">CNPJ: ${contract.cnpj}</div>
    </td>
    <td style="width: 50%; text-align: center; vertical-align: middle;">
      <div class="title">Boletim de Medição - Fornecedor</div>
      <div class="subtitle">${contract.fornecedor.toUpperCase()}</div>
    </td>
    <td style="width: 25%; text-align: right; vertical-align: top; font-size: 7pt;">
      <div>Folha: 1/1</div>
      <div>Data emissão: ${formatDate(bm.dataEmissao)}</div>
      <div>Período:</div>
      <div>${formatDate(bm.periodoInicio)} a ${formatDate(bm.periodoFim)}</div>
      <div style="margin-top: 2px;">Medição N.º:</div>
      <div style="font-size: 14pt; font-weight: bold;">${String(bm.numero).padStart(3, '0')}</div>
    </td>
  </tr>
</table>

<table style="margin-bottom: 4px;">
  <tr>
    <td class="info-label" style="width: 60px;">Pedido Nº:</td>
    <td class="info-val">${contract.numeroPedido}</td>
    <td class="info-label" style="width: 40px;">Nº CTO</td>
    <td class="info-val" colspan="2"></td>
  </tr>
  <tr>
    <td class="info-label">Objeto:</td>
    <td class="info-val" colspan="4" style="font-size: 6.5pt;">${contract.objeto}</td>
  </tr>
  <tr>
    <td colspan="3"></td>
    <td class="info-label c">${contract.tipoLabel.toUpperCase()}</td>
    <td class="info-val c"></td>
  </tr>
</table>

<table>
  <thead>
    <tr>
      <th rowspan="2" style="width: 30px;">LINHA</th>
      <th rowspan="2">DESCRIÇÃO DO SERVIÇO</th>
      <th colspan="4" style="text-align: center;">CONTRATO</th>
      <th colspan="8" style="text-align: center;">MEDIÇÃO</th>
    </tr>
    <tr>
      <th>UNIDADE</th>
      <th>QUANT.</th>
      <th>PREÇO</th>
      <th>VALOR TOTAL (R$)</th>
      <th colspan="2">ACUMULADO ANTERIOR</th>
      <th colspan="2">MEDIDO</th>
      <th>TOTAL ACUMULADO</th>
      <th>SALDO</th>
      <th>Exec.%</th>
      <th>Centro de Custo</th>
    </tr>
    <tr>
      <th></th><th></th><th></th><th></th><th></th><th></th>
      <th>QUANT.</th><th>VALOR (R$)</th>
      <th>QUANT.</th><th>VALOR (R$)</th>
      <th></th><th></th><th></th><th></th>
    </tr>
  </thead>
  <tbody>
    ${linesHtml}
    ${emptyRowsHtml}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="5" class="r">TOTAL GERAL</td>
      <td class="r">${formatCurrency(totalContrato)}</td>
      <td class="r" colspan="2">${formatCurrency(bm.linhas.reduce((s, l) => s + l.acumuladoAnteriorValor, 0))}</td>
      <td class="r" colspan="2">${formatCurrency(bm.valorTotal)}</td>
      <td class="r b">${formatCurrency(totalAcumulado)}</td>
      <td class="r b">${formatCurrency(totalSaldo)}</td>
      <td class="r">${totalContrato > 0 ? ((totalAcumulado / totalContrato) * 100).toFixed(0) : 0}%</td>
      <td></td>
    </tr>
  </tfoot>
</table>

<div style="margin-top: 4px;">
  <table class="footer-table" style="margin-bottom: 2px;">
    <tr>
      <td class="no-border" style="width: 50%;">
        <b>Valor da Medição: ${formatCurrency(bm.valorTotal)}</b><br>
        <b>Valor da Medição por extenso (R$):</b> ${numberToWords(bm.valorTotal)}
      </td>
      <td class="no-border" style="width: 50%; text-align: center;">
        <div style="font-weight:bold; margin-bottom: 8px;">ASSINATURAS</div>
        <table style="width: 100%;">
          <tr>
            <td class="no-border c" style="width: 50%; padding-top: 20px; border-top: 1px solid #999;">
              GRUPO MS - GESTOR CONTRATANTE
            </td>
            <td class="no-border c" style="width: 50%; padding-top: 20px; border-top: 1px solid #999;">
              ${contract.fornecedor.toUpperCase()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>

<div style="margin-top: 6px; display: flex; gap: 8px;">
  <table style="width: 35%; font-size: 7pt;">
    <tr><td class="info-label">VALOR CONTRATO ORIGINAL</td><td class="r">${formatCurrency(contract.valorTotal)}</td></tr>
    <tr><td class="info-label">(+) ADITIVO VALOR ADICIONADO</td><td class="r">${formatCurrency(0)}</td></tr>
    <tr><td class="info-label">(-) ADITIVO VALOR REDUZIDO</td><td class="r">${formatCurrency(0)}</td></tr>
    <tr><td class="info-label">VALOR DO CONTRATO ATUAL</td><td class="r">${formatCurrency(contract.valorTotal)}</td></tr>
    <tr><td class="info-label">BM's ACUMULADA</td><td class="r">${formatCurrency(totalAcumulado)}</td></tr>
    <tr><td class="info-label">BM DO MÊS</td><td class="r">${formatCurrency(bm.valorTotal)}</td></tr>
    <tr><td class="info-label">SALDO CONTRATUAL</td><td class="r b">${formatCurrency(totalSaldo)}</td></tr>
    <tr><td class="info-label">AVANÇO FINANCEIRO %</td><td class="r">${totalContrato > 0 ? ((totalAcumulado / totalContrato) * 100).toFixed(0) : 0}%</td></tr>
  </table>
  <table style="width: 25%; font-size: 7pt;">
    <tr><td colspan="2" class="section-title c">Vigência Contratual</td></tr>
    <tr><td class="info-label">INÍCIO:</td><td>${formatDate(contract.dataInicio)}</td></tr>
    <tr><td class="info-label">TÉRMINO:</td><td>${formatDate(contract.dataFim)}</td></tr>
  </table>
  <table style="width: 40%; font-size: 6.5pt;">
    <tr><td colspan="10" class="section-title c">QUADRO DE CONTROLE</td></tr>
    ${bmControlHtml}
  </table>
</div>

<script>window.onload = () => window.print();</script>
</body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}